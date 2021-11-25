/* eslint-disable @typescript-eslint/no-misused-promises */
import {Application, Binding, Context, CoreBindings, inject, Server} from '@loopback/core';
import {MetadataInspector} from '@loopback/metadata';
import {repository} from '@loopback/repository';
import {AmqpConnectionManager, AmqpConnectionManagerOptions, ChannelWrapper, connect} from 'amqp-connection-manager';
import {Channel, ConfirmChannel, Message, Options} from 'amqplib';
import {RabbitmqSubscribeMetadata, RABBITMQ_SUBSCRIBE_DECORATOR} from '../decorators/rabbitmq-subscribe.decorator';
import {RabbitmqBindings} from '../keys';
import {Category} from '../models';
import {CategoryRepository} from '../repositories';

/**
 * Category message sample
 *
Routing Key
// Create
model.category.created
{
  "id": "123",
  "name": "nova categoria"
}

// Update
model.category.updated
{
  "id": "123",
  "name": "Atualizada",
  "created_at": "2021-09-24T00:00:00",
  "updated_at": "2021-09-24T00:00:00"
}
 */

export enum ResponseEnum {
  ACK,
  REQUEUE,
  NACK,
}

export interface Exchange {
  name: string;
  type: string;
  options?: Options.AssertExchange
}

export interface Queue {
  name: string;
  options?: Options.AssertQueue;
  exchange?: {
    name: string;
    routingKey: string;
  }
}

export interface RabbitmqConfig {
  uri: string;
  connOptions?: AmqpConnectionManagerOptions;
  exchanges?: Exchange[];
  queues?: Queue[]
  defaultHandleError?: ResponseEnum;
}

export interface ExceededInput {
  channel: Channel;
  message: Message;
}

export const MAX_ATTEMPTS = 2;

export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  private _conn: AmqpConnectionManager;
  private _channelManager: ChannelWrapper;
  channel: Channel;

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE) public app: Application,
    @inject(RabbitmqBindings.CONFIG) private config: RabbitmqConfig,
    @repository(CategoryRepository) private categoryRepo: CategoryRepository) {
    super(app);
    console.log('[config]', config);
  };



  async start(): Promise<void> {
    this._conn = connect([this.config.uri], this.config.connOptions);
    this._channelManager = this._conn.createChannel();
    this._channelManager.on('connect', () => {
      this._listening = true;
      console.log('Successfully connected to a RabbitMQ channel');
    })
    this._channelManager.on('error', (err, {name}) => {
      this._listening = false;
      console.log(`Failed to setup a RabbitMQ channel - name: ${name} | error: ${err.message}`);
    })
    await this.setupExchanges();
    await this.setupQueues();
    await this.bindSubscribers();
  }

  private async setupExchanges() {
    const {exchanges} = this.config;

    return this.channelManager.addSetup(async (channel: ConfirmChannel) => {
      if (!exchanges) {
        return;
      }

      await Promise.all(exchanges.map((exchange) =>
        channel.assertExchange(exchange.name, exchange.type, exchange.options)
      ))
    });
  }

  private async setupQueues() {
    const {queues} = this.config;

    return this.channelManager.addSetup(async (channel: ConfirmChannel) => {
      if (!queues) {
        return;
      }

      await Promise.all(queues.map(async (queue) => {
        await channel.assertQueue(queue.name, queue.options);
        if (!queue.exchange) {
          return;
        }
        await channel.bindQueue(
          queue.name,
          queue.exchange.name,
          queue.exchange.routingKey
        );
      }
      ))
    });
  }

  private async bindSubscribers() {
    this
      .getSubscribers()
      .map(async (item) => {
        await this.channelManager.addSetup(async (channel: ConfirmChannel) => {
          const {exchange, queue, routingKey, queueOptions} = item.metadata;
          const assertQueue = await channel.assertQueue(
            queue ?? '',
            queueOptions ?? undefined
          );

          const routingKeys = Array.isArray(routingKey) ? routingKey : [routingKey];

          await Promise.all(
            routingKeys.map(x => channel.bindQueue(assertQueue.queue, exchange, x))
          );

          await this.consume({
            channel,
            queue: assertQueue.queue,
            method: item.method
          });

        })
      })
  }

  private getSubscribers(): {method: Function, metadata: RabbitmqSubscribeMetadata}[] {
    const bindings: Array<Readonly<Binding>> = this.find('services.*');

    return bindings.map(binding => {
      const serviceProto = binding.valueConstructor?.prototype;
      const metadata = MetadataInspector.getAllMethodMetadata<RabbitmqSubscribeMetadata>(RABBITMQ_SUBSCRIBE_DECORATOR, serviceProto);
      //console.log('[Metadata]', metadata)
      if (!metadata) {
        return [];
      }
      const methods: any[] = [];
      for (const methodName in metadata) {
        if (!Object.prototype.hasOwnProperty.call(metadata, methodName)) {
          return;
        }

        const service = this.getSync(binding.key) as any;

        methods.push({
          method: service[methodName].bind(service),
          metadata: metadata[methodName]
        })
      }

      return methods;
    })
      .reduce((collection: any, item: any) => {
        collection.push(...item);
        return collection;
      }, []);
  }

  private async consume({channel, queue, method}: {channel: ConfirmChannel, queue: string, method: Function}) {
    await channel.consume(queue, async message => {
      try {
        if (!message) {
          throw new Error("Recived null message");
        }

        const {content} = message;

        if (content) {
          let data;
          try {
            data = JSON.parse(content.toString());
          } catch (error) {
            data = null;
          }
          console.log('[consume]', data);

          const responseType = await method({data, message, channel});
          this.dispatchResponse(channel, message, responseType);
        }
      } catch (error) {
        console.error(error, {
          routingKey: message?.fields.routingKey,
          content: message?.content.toString()
        });
        if (!message) {
          return;
        }
        this.dispatchResponse(channel, message, this.config?.defaultHandleError);
      }
    });
  }

  private dispatchResponse(channel: Channel, message: Message, responseType?: ResponseEnum) {
    switch (responseType) {
      case ResponseEnum.REQUEUE:
        channel.nack(message, false, true);
        break;
      case ResponseEnum.NACK:
        this.handleNack({channel, message});
        break;
      case ResponseEnum.ACK:
      default:
        channel.ack(message);
    }
  }

  handleNack({channel, message}: ExceededInput) {
    const canDeadLetter = this.canDeadLetter({channel, message});
    if (canDeadLetter) {
      console.log(`Nack in message`, {
        content: message.content.toString()
      });
      channel.nack(message, false, false);
    } else {
      channel.ack(message);
    }
  }

  async sync({model, event, data}: {model: string, event: string, data: Category}) {
    if (model === 'category') {
      switch (event) {
        case 'created':
          await this.categoryRepo.create({
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          break;
        case 'updated':
          await this.categoryRepo.updateById(data.id, data);
          break;
        case 'deleted':
          await this.categoryRepo.deleteById(data.id);
          break;
      }
    }
  }

  canDeadLetter({channel, message}: ExceededInput) {
    if (message.properties.headers && 'x-death' in message.properties.headers) {
      const count = message.properties.headers['x-death']![0].count;
      if (count >= MAX_ATTEMPTS) {
        channel.ack(message);
        const queue = message.properties.headers['x-death']![0].queue ?? '';
        console.error(`Ack in ${queue} with error. Max attempts exceeded: ${MAX_ATTEMPTS}`);
        return false;
      }
    }
    return true;
  }

  async stop(): Promise<void> {
    await this._conn.close();
    this._listening = false;
  }

  get listening(): boolean {
    return this._listening;
  }

  get conn(): AmqpConnectionManager {
    return this._conn;
  }

  get channelManager(): ChannelWrapper {
    return this._channelManager;
  }

}
