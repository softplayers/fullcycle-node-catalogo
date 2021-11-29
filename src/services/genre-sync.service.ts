import {BindingScope, injectable, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CategoryRepository, GenreRepository} from '../repositories';
import {BaseSycSyncService} from './base-model-sync.service';
import {ValidatorService} from './validator.service';

@injectable({scope: BindingScope.SINGLETON})
export class GenreSyncService extends BaseSycSyncService {
  constructor(
    @repository(GenreRepository) private genreRepo: GenreRepository,
    @repository(CategoryRepository) private categoryRepo: CategoryRepository,
    @service(ValidatorService) private validator: ValidatorService,
  ) {
    super(validator);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.genre.*',
    queue: 'micro-catalog/sync-videos/genre',
  })
  async handler({data, message}: {data: any, message: Message}) {
    await this.sync({
      repo: this.genreRepo,
      data,
      message
    })
  }


  /**-/
   {
     "id":"dcd23ead-3e66-4bfd-81f7-2d1c31e949f1",
     "relation_ids":[
       "575856e5-2cf4-4381-9891-9eb666241755",
       "a8430518-4587-4abe-a14f-75df83795c3f",
       "d0440144-fdd4-4f0d-87e2-67f0eb6ff50a",
       "f27be96e-5305-4792-b54a-984d15dc492c",
       "f5b66597-a379-4058-9b09-262f81e1cdd7"
      ]
    }
  /**/
  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.genre_categories.*',
    queue: 'micro-catalog/sync-videos/genre_categories',
  })
  async handlerCategories({data, message}: {data: any, message: Message}) {
    await this.syncRelations({
      id: data.id,
      repo: this.genreRepo,
      relationName: "categories",
      relationIds: data.relation_ids,
      relationRepo: this.categoryRepo,
      message,
    })
  }
}
