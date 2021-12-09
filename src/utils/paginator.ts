import {RequestContext} from '@loopback/rest';
import {stringify} from 'querystring';

export interface Page<T> {
  results: T[];
  count: number;
  limit: number;
  offset: number;
}

export class PaginatorSerializer<T> {

  public baseUrl: string;

  constructor(public page: Page<T>) { }

  private get previous_url() {
    let previous: string | null = null;
    const {offset, count, limit} = this.page;
    if (offset > 0 && count) {
      previous = `${this.baseUrl}?${stringify({
        filter: {
          limit,
          ...(offset - limit >= 0 && {offset: offset})
        }
      })}`;
    }
    return previous;
  }

  private get next_url() {
    let next: string | null = null;
    const {offset, limit, count} = this.page;
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
    this.baseUrl = `${req.requestedBaseUrl}${req.request.url}`;
    return {
      ...this.page,
      next_url: this.next_url,
      previous_url: this.previous_url
    }
  }

}
