import {DefaultCrudRepository} from '@loopback/repository';
import {Message} from 'amqplib';
import {ValidatorService} from './validator.service';

interface SyncOptions {
  repo: DefaultCrudRepository<any, any>;
  data: any;
  message: Message
}
export abstract class BaseSycSyncService {

  constructor(public validatorService: ValidatorService) {

  }

  protected async sync({repo, data, message}: SyncOptions) {
    const action = this.getAction(message);
    const entity = this.createEntity(data, repo);
    console.log("[ENTITY]", entity);

    switch (action) {
      case 'created':
        await this.validatorService.validate({
          data: entity,
          entityClass: repo.entityClass,
        })
        await repo.create(entity);
        break;
      case 'updated':
        await this.updateOrCreate({repo, id: data.id, entity});
        break;
      case 'deleted':
        await repo.deleteById(data.id);
        break;
      default:
        console.error('Unknow action:', action);
        break;
    }
  }

  protected getAction(message: Message) {
    return message.fields.routingKey.split('.')[2];
  }

  protected createEntity(data: any, repo: DefaultCrudRepository<any, any>) {
    return Object.keys(repo.entityClass.definition.properties).reduce((acc, key) => {
      if (data.hasOwnProperty(key)) {
        acc[key] = data[key];
      }

      return acc;
    }, {} as any);
  }

  protected async updateOrCreate({repo, id, entity}: {repo: DefaultCrudRepository<any, any>, id: string, entity: any}) {
    const exists = await repo.exists(id);
    await this.validatorService.validate({
      data: entity,
      entityClass: repo.entityClass,
      ...(exists && {options: {partial: true}}),
    })

    return exists ? repo.updateById(id, entity) : repo.create(entity)
  }

}
