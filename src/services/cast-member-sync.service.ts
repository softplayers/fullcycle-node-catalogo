import {BindingScope, injectable, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CastMemberRepository} from '../repositories';
import {BaseSycSyncService} from './base-model-sync.service';
import {ValidatorService} from './validator.service';

@injectable({scope: BindingScope.SINGLETON})
export class CastMemberSyncService extends BaseSycSyncService {
  constructor(
    @repository(CastMemberRepository) private castMemberRepo: CastMemberRepository,
    @service(ValidatorService) private validator: ValidatorService,
  ) {
    super(validator);
  }


  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.cast-member.*',
    queue: 'micro-catalog/sync-videos/cast-member',
  })
  async handler({data, message}: {data: any, message: Message}) {
    await this.sync({
      repo: this.castMemberRepo,
      data,
      message
    })
  }
}
