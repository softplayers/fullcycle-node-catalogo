import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {GenreRepository} from '../repositories';
import {BaseSycSyncService} from './base-model-sync.service';

@injectable({scope: BindingScope.SINGLETON})
export class GenreSyncService extends BaseSycSyncService {
  constructor(
    @repository(GenreRepository) private genreRepo: GenreRepository,
  ) {
    super();
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.genre.*',
    queue: 'micro-catalog/sync-videos/genre',
  })
  async handler({data, message}: {data: any, message: Message}) {
    this.sync({
      repo: this.genreRepo,
      data,
      message
    })
  }
}
