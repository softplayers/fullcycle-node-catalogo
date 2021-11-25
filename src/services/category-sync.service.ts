import {BindingScope, injectable, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CategoryRepository} from '../repositories';
import {ResponseEnum} from '../servers';
import {BaseSycSyncService} from './base-model-sync.service';
import {ValidatorService} from './validator.service';

@injectable({scope: BindingScope.SINGLETON})
export class CategorySyncService extends BaseSycSyncService {

  constructor(
    @repository(CategoryRepository) private categoryRepo: CategoryRepository,
    @service(ValidatorService) private validator: ValidatorService,
  ) {
    super(validator);
  }



  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.category.*',
    queue: 'micro-catalog/sync-videos/category',
    queueOptions: {
      deadLetterExchange: 'dlx.amq.topic'
    }
  })
  async handler({data, message}: {data: any, message: Message}) {

    /*
    await new Promise(resolve => setTimeout(resolve, 10000));
    return ResponseEnum.NACK;
    */

    return ResponseEnum.NACK;

    await this.sync({
      repo: this.categoryRepo,
      data,
      message
    })
  }
}
