import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CategoryRepository} from '../repositories';
import {BaseSycSyncService} from './base-model-sync.service';

@injectable({scope: BindingScope.SINGLETON})
export class CategorySyncService extends BaseSycSyncService {

  constructor(
    @repository(CategoryRepository) private categoryRepo: CategoryRepository,
  ) {
    super();
  }


  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.category.*',
    queue: 'micro-catalog/sync-videos/category',
  })
  async handler({data, message}: {data: any, message: Message}) {
    await this.sync({
      repo: this.categoryRepo,
      data,
      message
    })
  }
}
