import {Filter, FilterBuilder} from '@loopback/repository';
import {Category} from '../models';

export class CategotyFilterBuilder extends FilterBuilder<Category> {
  constructor(f?: Filter<Category>) {
    super(f);
  }

  private defaultFilter() {
    return {
      where: {
        is_active: true
      }
    }
  }

  build(): Filter<Category> {
    return this.impose(this.defaultFilter()).filter
  }
}
