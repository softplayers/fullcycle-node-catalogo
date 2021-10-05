import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CastMemberRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class CastMemberSyncService {
  constructor(
    @repository(CastMemberRepository) private castMemberRepo: CastMemberRepository,
  ) { }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.cast-member.*',
    queue: 'cast-member',
  })
  logger({data}: {data: any}) {
    console.log('[CastMember::Log]', data);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.cast-member.created',
    queue: 'cast-member-created',
  })
  async created({data}: {data: any}) {
    return this.castMemberRepo.create(data);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.cast-member.updated',
    queue: 'cast-member-updated',
  })
  async updated({data}: {data: any}) {
    return this.castMemberRepo.updateById(data.id, data);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.cast-member.deleted',
    queue: 'cast-member-deleted',
  })
  async deleted({data}: {data: any}) {
    return this.castMemberRepo.deleteById(data.id);
  }

}
