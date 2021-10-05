import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CategoryRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class CategorySyncService {
  constructor(
    @repository(CategoryRepository) private categoryRepo: CategoryRepository,
  ) { }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'x',
    routingKey: 'model.category.*'
  })

  handler({data}: {data: any}) {
    console.log('[Category::Handler]', data);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'x1',
    routingKey: 'model.category1.*'
  })
  handler1({data}: {data: any}) {
    console.log('[Category::Handler1]', data);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.category.created',
    queue: 'category-created',
  })
  async created({data}: {data: any}) {
    console.log('[Category::Created]', data);
    return this.categoryRepo.create(data);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.category.updated',
    queue: 'category-updated',
  })
  async updated({data}: {data: any}) {
    console.log('[Category::Updated]', data);
    return this.categoryRepo.updateById(data.id, data);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.category.deleted',
    queue: 'category-deleted',
  })
  async deleted({data}: {data: any}) {
    console.log('[Category::Deleted]', data);
    return this.categoryRepo.deleteById(data.id);
  }

}
