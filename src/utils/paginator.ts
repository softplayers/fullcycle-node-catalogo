import {RequestContext} from '@loopback/rest';
import {Exclude, Expose, instanceToPlain} from 'class-transformer';
import {stringify} from 'qs';


/*
export interface Page<T> {
  results: T[];
  count: number;
  limit: number;
  offset: number;
}
*/

export class PaginatorSerializer<T> {

  @Exclude()
  public baseUrl: string;

  constructor(
    public results: T[],
    public count: number,
    public limit: number,
    public offset: number,
  ) {
  }

  @Expose()
  get previous_url() {
    let previous: string | null = null;
    const {offset, count, limit} = this;
    if (offset > 0 && count) {
      previous = `${this.baseUrl}?${stringify({
        filter: {
          limit,
          ...(offset - limit >= 0 && {offset: offset - limit})
        }
      })}`;
    }
    return previous;
  }

  @Expose()
  get next_url() {
    let next: string | null = null;
    const {offset, limit, count} = this;
    if (offset + limit < count) {
      next = `${this.baseUrl}?${stringify({
        filter: {
          limit,
          ...(offset >= 0 && limit >= 0 && {offset: offset + limit})
        }
      })}`;
    }
    return next;
  }

  toJson(req: RequestContext) {
    this.baseUrl = `${req.requestedBaseUrl}${req.request.path}`;
    return instanceToPlain(this);
  }

  /*
  toJson(req: RequestContext) {
    this.baseUrl = `${req.requestedBaseUrl}${req.request.url}`;
    return {
      ...this.page,
      next_url: this.next_url,
      previous_url: this.previous_url
    }
  }
  */

}
