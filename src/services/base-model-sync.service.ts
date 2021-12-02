import {DefaultCrudRepository, EntityNotFoundError} from '@loopback/repository';
import {Message} from 'amqplib';
import {ValidatorService} from './validator.service';

export interface SyncOptions {
  repo: DefaultCrudRepository<any, any>;
  data: any;
  message: Message
}

export interface SyncRelationOptions {
  id: string;
  repo: DefaultCrudRepository<any, any>;
  relationName: string;
  relationIds: string[];
  relationRepo: DefaultCrudRepository<any, any>;
  message: Message;
}

export abstract class BaseSycSyncService {

  constructor(public validatorService: ValidatorService) {

  }

  protected async sync({repo, data, message}: SyncOptions) {
    const action = this.getAction(message);
    const entity = this.createEntity(data, repo);

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

  async syncRelations({
    id,
    repo,
    relationName,
    relationIds,
    relationRepo,
    message,
  }: SyncRelationOptions) {

    const fieldsRelation = this.extractFiledsRelation(repo, relationName);

    const collection = await relationRepo.find({
      fields: fieldsRelation,
      where: {
        or: relationIds.map(idRelation => ({id: idRelation})),
      },
    });

    if (!collection.length) {
      const error = new EntityNotFoundError(relationRepo.entityClass, relationIds);
      error.name = 'EntityNotFound';
      throw error;
    }

    const action = this.getAction(message);
    if (action == 'attached') {
      await (repo as any).attachRelation(id, relationName, collection);
    }
    else {
      console.warn('[syncRelations] unknown action:', action)
    }
  }

  extractFiledsRelation(repo: DefaultCrudRepository<any, any>, relation: string) {
    return Object
      .keys(repo.modelClass.definition.properties[relation].jsonSchema.items.properties)
      .reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {});
  }

}
