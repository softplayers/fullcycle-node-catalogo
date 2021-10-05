import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {GenreRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class GenreSyncService {
  constructor(
    @repository(GenreRepository) private genreRepo: GenreRepository,
  ) { }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.genre.*',
    queue: 'genre',
  })
  logger({data}: {data: any}) {
    console.log('[Genre::Log]', data);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.genre.created',
    queue: 'genre-created',
  })
  async created({data}: {data: any}) {
    return this.genreRepo.create(data);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.genre.updated',
    queue: 'genre-updated',
  })
  async updated({data}: {data: any}) {
    return this.genreRepo.updateById(data.id, data);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.genre.deleted',
    queue: 'genre-deleted',
  })
  async deleted({data}: {data: any}) {
    return this.genreRepo.deleteById(data.id);
  }


}
