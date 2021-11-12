import {Entity, model, property} from '@loopback/repository';
import {SmallCategory} from '.';

@model({settings: {strict: false}})
export class Genre extends Entity {

  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 255,
    }
  })
  name: string;

  @property({
    type: 'boolean',
    required: false,
    default: true,
  })
  is_active: boolean;

  @property({
    type: 'date',
    required: true
  })
  created_at: string;

  @property({
    type: 'date',
    required: true
  })
  updated_at: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  [prop: string]: any;

  @property({
    type: 'object',
    jsonSchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {type: 'string'},
          name: {type: 'string'},
          is_active: {type: 'boolean'},
        }
      },
      uniqueItems: true
    }
  })
  categories: SmallCategory;

  constructor(data?: Partial<Genre>) {
    super(data);
  }
}

export interface GenreRelations {
  // describe navigational properties here
}

export type GenreWithRelations = Genre & GenreRelations;
