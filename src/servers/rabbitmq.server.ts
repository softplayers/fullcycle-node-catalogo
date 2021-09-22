import {Context, Server} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Channel, connect, Connection, Replies} from 'amqplib';
import {CategoryRepository} from '../repositories';


export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  conn: Connection;

  constructor(@repository(CategoryRepository) private categoryRepo: CategoryRepository) {
    super();
    console.log('[Constr]', this.categoryRepo);
  }

  async start(): Promise<void> {
    this.conn = await connect({
      hostname: 'rabbitmq', // rabbitmq
      username: 'rabbitmq',
      password: 'rabbitmq'
    })
    this._listening = true;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.boot();
  }

  async boot() {
    const QUEUE = 'micro-catalog/sync-videos';
    const channel: Channel = await this.conn.createChannel();
    const queue: Replies.AssertQueue = await channel.assertQueue(QUEUE);
    const exchange: Replies.AssertExchange = await channel.assertExchange('amq.topic', 'topic');

    await channel.bindQueue(queue.queue, exchange.exchange, 'model.*.*');

    //const result = channel.sendToQueue(QUEUE, Buffer.from('hello world'));
    channel.publish('amq.direct', 'my-routing-key', Buffer.from('hello world -> routing key'));

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    channel.consume(queue.queue, (message) => {
      if (!message) return;
      console.log("[MESSAGE]", JSON.parse(message.content.toString()));

      const [model, event] = message.fields.routingKey.split('.').slice(1);
      console.log("[META] model:", model, "/ event:", event)
    });
  }

  async stop(): Promise<void> {
    await this.conn.close();
    this._listening = false;
  }

  get listening(): boolean {
    return this._listening;
  }

}
