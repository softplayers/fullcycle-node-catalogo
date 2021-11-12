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
