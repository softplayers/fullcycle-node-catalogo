import {Context, Server} from '@loopback/core';
import {Channel, connect, Connection, Replies} from 'amqplib';


export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  conn: Connection;


  async start(): Promise<void> {
    this.conn = await connect({
      hostname: 'rabbitmq', // rabbitmq
      username: 'rabbitmq',
      password: 'rabbitmq'
    })
    this._listening = true;
    this.boot();
  }

  async boot() {
    const QUEUE = 'first-queue';
    const channel: Channel = await this.conn.createChannel();
    const queue: Replies.AssertQueue = await channel.assertQueue(QUEUE);
    const exchange: Replies.AssertExchange = await channel.assertExchange('amq.direct', 'direct');
    await channel.bindQueue(queue.queue, exchange.exchange, 'my-routing-key')
    //const result = channel.sendToQueue(QUEUE, Buffer.from('hello world'));
    channel.publish('amq.direct', 'my-routing-key', Buffer.from('hello world -> routing key'));
    channel.consume(queue.queue, (message) => {
      console.log("[MESSAGE]", message?.content.toString());
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
