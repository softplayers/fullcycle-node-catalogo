import {BindingScope, injectable, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {GenreRepository} from '../repositories';
import {BaseSycSyncService} from './base-model-sync.service';
import {ValidatorService} from './validator.service';

@injectable({scope: BindingScope.SINGLETON})
export class GenreSyncService extends BaseSycSyncService {
  constructor(
    @repository(GenreRepository) private genreRepo: GenreRepository,
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
}
