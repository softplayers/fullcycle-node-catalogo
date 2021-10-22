import {BindingScope, inject, injectable} from '@loopback/core';
import {getModelSchemaRef} from '@loopback/openapi-v3';
import {repository} from '@loopback/repository';
import {AjvFactory, RestBindings, validateRequestBody} from '@loopback/rest';
import {CategoryRepository} from '../repositories';

interface ValidateOptions<T> {
  data: object;
  entityClass: Function & {prototype: T};
}

@injectable({scope: BindingScope.SINGLETON})
export class ValidatorService {

  cache = new Map();

  constructor(
    @repository(CategoryRepository) private categoryRepo: CategoryRepository,
    @inject(RestBindings.AJV_FACTORY) private ajvFactory: AjvFactory,
  ) {
  }

  async validate<T extends object>({data, entityClass}: ValidateOptions<T>) {
    const modelSchema = getModelSchemaRef(entityClass);
    if (!modelSchema) {
      const error = new Error('The parameter entityClass is not an entity');
      error.name = 'NotEntityClass';
      throw error;
    }

    const schemaRef = {$ref: modelSchema.$ref};
    const schemaName = Object.keys(modelSchema.definitions)[0];
    if (!this.cache.has(schemaName)) {
      this.cache.set(schemaName, modelSchema.definitions[schemaName]);
    }

    const globalSchemas = Array.from(this.cache).reduce<any>(
      (obj, [key, value]) => {obj[key] = value; return obj},
      {}
    );
    console.dir(globalSchemas, {depth: 8})

    await validateRequestBody(
      {value: data, schema: schemaRef},
      {required: true, content: {}},
      modelSchema.definitions,
      {ajvFactory: this.ajvFactory}
    );
  }
}
