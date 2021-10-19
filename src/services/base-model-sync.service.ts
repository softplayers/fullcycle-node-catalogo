import {DefaultCrudRepository} from '@loopback/repository';
import {Message} from 'amqplib';

interface SyncOptions {
  repo: DefaultCrudRepository<any, any>;
  data: any;
  message: Message
}
export class BaseSycSyncService {
  protected async sync({repo, data, message}: SyncOptions) {
    const action = this.getAction(message);
    const entity = this.createEntity(data, repo);
    console.log("[ENTITY]", entity);

    switch (action) {
      case 'created':
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
    return await repo.exists(id) ? repo.updateById(id, entity) : repo.create(entity)
  }

}
