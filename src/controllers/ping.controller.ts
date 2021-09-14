import {inject} from '@loopback/core';
import {ClassDecoratorFactory, MetadataInspector} from '@loopback/metadata';
import {
  get, Request, response,
  ResponseObject, RestBindings
} from '@loopback/rest';

/**
 * OpenAPI response for ping()
 */
const PING_RESPONSE: ResponseObject = {
  description: 'Ping Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PingResponse',
        properties: {
          greeting: {type: 'string'},
          date: {type: 'string'},
          url: {type: 'string'},
          headers: {
            type: 'object',
            properties: {
              'Content-Type': {type: 'string'},
            },
            additionalProperties: true,
          },
        },
      },
    },
  },
};


interface MyClassMetaData {

}

const myClassDecorator = (spec: MyClassMetaData) => new ClassDecoratorFactory<MyClassMetaData>(
  'meta-data-my-class-decorator',
  spec
).create();


/**
 * A simple controller to bounce back http requests
 */
@myClassDecorator({name: 'code education'})
export class PingController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) { }

  // Map to `GET /ping`
  @get('/ping')
  @response(200, PING_RESPONSE)
  ping(): object {
    // Reply with a greeting, the current time, the url, and request headers
    return {
      greeting: 'Hello from LoopBackaaa',
      date: new Date(),
      url: this.req.url,
      headers: Object.assign({}, this.req.headers),
    };
  }
}

const meta = MetadataInspector.getClassMetadata<MyClassMetaData>(
  'meta-data-my-class-decorator',
  PingController
)

console.log(meta);
