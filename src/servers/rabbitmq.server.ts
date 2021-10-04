import {Application, Binding, Context, CoreBindings, inject, Server} from '@loopback/core';
import {MetadataInspector} from '@loopback/metadata';
import {repository} from '@loopback/repository';
import {AmqpConnectionManager, AmqpConnectionManagerOptions, ChannelWrapper, connect} from 'amqp-connection-manager';
import {Channel, ConfirmChannel, Options} from 'amqplib';
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

export interface Exchange {
  name: string; type: string; options?: Options.AssertExchange
}

export interface RabbitmqConfig {
  uri: string;
  connOptions?: AmqpConnectionManagerOptions;
  exchanges?: Exchange[]
}

export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  private _conn: AmqpConnectionManager;
  private _channelManager: ChannelWrapper;
  channel: Channel;

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE) public app: Application,
    @repository(CategoryRepository) private categoryRepo: CategoryRepository,
    @inject(RabbitmqBindings.CONFIG) private config: RabbitmqConfig) {
    super(app);
    console.log('[config]', config);
  }

  async start(): Promise<void> {
    this._conn = connect([this.config.uri], this.config.connOptions);
    this._channelManager = this._conn.createChannel();
    this._channelManager.on('connect', () => {
      this._listening = true;
      console.log('Successfully connected to a RabbitMQ channel');
    })
    this._channelManager.on('error', (err, {name}) => {
      this._listening = false;
      console.log(`Failed to setup a RabbitMQ channel - name: {name}`);
    })
    await this.setupExchanges();

    const subscribers = this.getSubscribers();
    console.log('[subscribers]', subscribers);
    // @ts-ignore
    console.log('[invoke0]', subscribers[0][0]['method']());
    // @ts-ignore
    console.log('[invoke1]', subscribers[0][1]['method']());

    // this.boot();
  }

  private async setupExchanges() {
    const {exchanges} = this.config;

    return this.channelManager.addSetup(async (channel: ConfirmChannel) => {
      if (!exchanges) {
        return;
      }

      Promise.all(exchanges.map((exchange) =>
        channel.assertExchange(exchange.name, exchange.type, exchange.options)
      ))
    });
  }

  private getSubscribers() {
    const bindings: Array<Readonly<Binding>> = this.find('services.*');


    return bindings.map(binding => {
      const serviceProto = binding.valueConstructor?.prototype;
      const metadata = MetadataInspector.getAllMethodMetadata<RabbitmqSubscribeMetadata>(RABBITMQ_SUBSCRIBE_DECORATOR, serviceProto);
      console.log('[Metadata]', metadata)
      if (!metadata) {
        return [];
      }
      const methods = [];
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
    });
  }

  async boot() {
    /** /
    const QUEUE = 'micro-catalog/sync-videos';
    this.channel = await this._conn.createChannel();
    const queue: Replies.AssertQueue = await this.channel.assertQueue(QUEUE);
    const exchange: Replies.AssertExchange = await this.channel.assertExchange('amq.topic', 'topic');

    await this.channel.bindQueue(queue.queue, exchange.exchange, 'model.*.*');

    this.channel.consume(queue.queue, (message) => {
      if (!message) return;
      console.log(message.content.toString());
      const data = JSON.parse(message.content.toString());
      const [model, event] = message.fields.routingKey.split('.').slice(1);
      this.sync({model, event, data})
        .then(() => this.channel.ack(message))
        .catch(() => this.channel.reject(message, false));
    });
    /**/
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
