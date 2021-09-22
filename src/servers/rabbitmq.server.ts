import {Context, Server} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Channel, connect, Connection, Replies} from 'amqplib';
import {Category} from '../models';
import {CategoryRepository} from '../repositories';


export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  conn: Connection;

  constructor(@repository(CategoryRepository) private categoryRepo: CategoryRepository) {
    super();
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

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    channel.consume(queue.queue, (message) => {
      if (!message) return;
      const data = JSON.parse(message.content.toString());
      const [model, event] = message.fields.routingKey.split('.').slice(1);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.sync({model, event, data});
    });
  }

  async sync({model, event, data}: {model: string, event: string, data: Category}) {
    if (model === 'category') {
      switch (event) {
        case 'created':
          await this.categoryRepo.create({
            ...data,
            created_at: new Date(),
            updated_at: new Date(),
          });
          break;
      }
    }
  }

  async stop(): Promise<void> {
    await this.conn.close();
    this._listening = false;
  }

  get listening(): boolean {
    return this._listening;
  }

}
