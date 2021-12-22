import {AnyObject, Filter, FilterBuilder, JsonSchema, Model, Where, WhereBuilder} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';

export abstract class DefaultFilter<MT extends object = AnyObject> extends FilterBuilder<MT> {
  defaultWhere: Where<MT> | null | undefined;

  constructor(f?: Filter<MT>) {
    super(f);
    const defaultWhere = this.defaultFilter();
    this.defaultWhere = defaultWhere ? JSON.parse(JSON.stringify(defaultWhere.filter.where)) : null;
    this.filter.where = {};
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

      const properties = jsonSchema.properties ?? jsonSchema?.items?.['properties'];
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
    return this.defaultWhere ? this.impose(this.defaultWhere).filter : this.filter;
  }
}
