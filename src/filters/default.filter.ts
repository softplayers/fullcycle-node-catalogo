import {AnyObject, Filter, FilterBuilder, JsonSchema, Model, Where, WhereBuilder} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';

export abstract class DefaultFilter<MT extends object = AnyObject> extends FilterBuilder<MT> {
  dFilter: Filter<MT> | null;

  constructor(f?: Filter<MT>) {
    super(f);
    const dFilter = this.defaultFilter();
    this.dFilter = dFilter ? JSON.parse(JSON.stringify(dFilter)) : null;
    this.filter = {};
  }

  // protected defaultFilter(): DefaultFilter<MT> | null { return null; }
  protected defaultFilter(): DefaultFilter<MT> | void { }

  isActive(modelCtor: typeof Model) {
    this.filter.where = new WhereBuilder<{is_active: boolean}>(this.filter.where)
      .eq('is_active', true)
      .build() as Where<MT>
    // WTF
    this.isActiveRelations(modelCtor);
    return this;
  }

  isActiveRelations(modelCtor: typeof Model) {
    const relations: string[] = Object.keys(modelCtor.definition.relations);

    if (!relations.length) {
      return this;
    }

    const schema = getJsonSchema(modelCtor);
    const relationsFiltered = relations.filter(r => {

      const jsonSchema = schema.properties?.[r] as JsonSchema;

      if (!jsonSchema || (jsonSchema.type !== "array" && jsonSchema.type !== "object")) {
        return false;
      }

      const properties = jsonSchema.properties || jsonSchema?.items?.['properties'];
      return Object.keys(properties).includes('is_active');
    });

    const whereStr = JSON.stringify(this.filter.where);
    const regex = new RegExp(`${relationsFiltered.map(r => `${r}.*`).join('|')}`);
    const matches = whereStr.match(regex);

    if (!matches) {
      return this;
    }

    const fields = matches.map(m => {
      const relation = m.split('.')[0];
      return {[`${relation}.is_active`]: true};
    })

    this.filter.where = new WhereBuilder<{is_active: boolean}>(this.filter.where)
      .and(fields)
      .build() as Where<MT>
    return this;
  }

  build() {
    return this.dFilter ? this.impose(this.dFilter).filter : this.filter;
  }
}
