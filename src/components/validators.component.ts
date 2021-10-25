import {Binding, Component, CoreBindings, inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {AjvKeyword, RestTags} from '@loopback/rest';
import {ApplicationWithServices} from '@loopback/service-proxy';
import Ajv, {ErrorObject} from 'ajv';

export class ValidatorsComponent implements Component {
  bindings: Array<Binding> = [];

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    private app: ApplicationWithServices
  ) {
    this.bindings = this.validators();
  }

  validators() {
    return [
      Binding
        .bind<AjvKeyword>('ajv.keywords.exists')
        .to({
          keyword: 'exists',
          async: true,
          validate: async ([model, field], value) => {
            const values = Array.isArray(value) ? value : [value];
            const repository = this.app.getSync<DefaultCrudRepository<any, any>>(`repositories.${model}Repository`);
            const rows = await repository.find({
              where: {
                or: values.map(v => ({[field]: v}))
              }
            })
            if (rows.length !== values.length) {
              const rowsValues = rows.map(r => r[field]);
              const valuesNotExists = values.filter(v => !rowsValues.includes(v));
              const errors = valuesNotExists.map(v => ({message: `The value ${v} for ${model} not existst`} as ErrorObject))
              throw new Ajv.ValidationError(errors);
            }
            return true;
          },
        })
        .tag(RestTags.AJV_KEYWORD)
    ]
  }
}
