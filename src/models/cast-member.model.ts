import {Entity, model, property} from '@loopback/repository';

@model({settings: {strict: false}})
export class CastMember extends Entity {

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
  })
  name: string;

  @property({
    type: 'integer',
    required: true,
  })
  type: number;

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

  constructor(data?: Partial<CastMember>) {
    super(data);
  }
}

export interface CastMemberRelations {
  // describe navigational properties here
}

export type CastMemberWithRelations = CastMember & CastMemberRelations;
