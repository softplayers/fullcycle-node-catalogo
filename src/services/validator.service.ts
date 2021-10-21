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

  constructor(
    @repository(CategoryRepository) private categoryRepo: CategoryRepository,
    @inject(RestBindings.AJV_FACTORY) private ajvFactory: AjvFactory,
  ) {
  }

  async validate<T extends object>({data, entityClass}: ValidateOptions<T>) {
    const modelSchema = getModelSchemaRef(entityClass);
    const schemaRef = {$ref: modelSchema.$ref};
    await validateRequestBody(
      {value: data, schema: schemaRef},
      {required: true, content: {}},
      modelSchema.definitions,
      {ajvFactory: this.ajvFactory}
    );
  }
}
