import {AnyObject, Filter, FilterBuilder, Where, WhereBuilder} from '@loopback/repository';

export abstract class DefaultFilter<MT extends object = AnyObject> extends FilterBuilder<MT> {
  dFilter: Filter<MT> | null;

  constructor(f?: Filter<MT>) {
    super(f);
    const dFilter = this.defaultFilter();
    this.dFilter = dFilter ? JSON.parse(JSON.stringify(dFilter)) : null;
  }

  // protected defaultFilter(): DefaultFilter<MT> | null { return null; }
  protected defaultFilter(): DefaultFilter<MT> | void { }

  isActive() {
    this.filter.where = new WhereBuilder<{is_active: boolean}>(this.filter.where)
      .eq('is_active', true)
      .build() as Where<MT>
    return this;
  }

  build() {
    return this.dFilter ? this.impose(this.dFilter).filter : this.filter;
  }
}
