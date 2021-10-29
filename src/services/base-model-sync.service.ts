import {DefaultCrudRepository, EntityNotFoundError} from '@loopback/repository';
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

  async syncRelations({id, relation, relationIds, repo, repoRelation, message}: {
    id: string;
    relation: string;
    relationIds: string[];
    repo: DefaultCrudRepository<any, any>;
    repoRelation: DefaultCrudRepository<any, any>;
    message: Message;
  }) {
    console.log('[props]', repo.modelClass.definition.properties[relation].jsonSchema.items.properties);
    const fieldsRelation = Object
      .keys(repo.modelClass.definition.properties[relation].jsonSchema.items.properties)
      .reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {});
    console.log('[fieldsRelation]', fieldsRelation)

    const collection = await repoRelation.find({
      fields: fieldsRelation,
      where: {
        or: relationIds.map(idRelation => ({id: idRelation})),
      },
    });

    console.log('[collection]', collection)
    if (!collection.length) {
      const error = new EntityNotFoundError(repoRelation.entityClass, relationIds);
      error.name = 'EntityNotFound';
      throw error;
    }

    await repo.updateById(id, {[relation]: collection});
  }

}
