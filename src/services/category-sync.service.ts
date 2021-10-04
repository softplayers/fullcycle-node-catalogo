import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CategoryRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class CategorySyncService {
  constructor(
    @repository(CategoryRepository) private categoryRepo: CategoryRepository,
  ) {}

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'x',
    routingKey: 'model.category.*'
  })
  handler() {
    console.log('[Handler]', this.categoryRepo.entityClass);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'x1',
    routingKey: 'model.category1.*'
  })
  handler1() {
    console.log('[Handler1]', this.categoryRepo.entityClass);
  }
}
