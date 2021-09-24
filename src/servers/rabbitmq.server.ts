import {Context, Server} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Channel, connect, Connection, Replies} from 'amqplib';
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
export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  conn: Connection;
  channel: Channel;

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
    this.channel = await this.conn.createChannel();
    const queue: Replies.AssertQueue = await this.channel.assertQueue(QUEUE);
    const exchange: Replies.AssertExchange = await this.channel.assertExchange('amq.topic', 'topic');

    await this.channel.bindQueue(queue.queue, exchange.exchange, 'model.*.*');

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.channel.consume(queue.queue, (message) => {
      if (!message) return;
      console.log(message.content.toString());
      const data = JSON.parse(message.content.toString());
      const [model, event] = message.fields.routingKey.split('.').slice(1);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.sync({model, event, data})
        .then(() => this.channel.ack(message))
        .catch(() => this.channel.reject(message, false));
    });
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
    await this.conn.close();
    this._listening = false;
  }

  get listening(): boolean {
    return this._listening;
  }

}
