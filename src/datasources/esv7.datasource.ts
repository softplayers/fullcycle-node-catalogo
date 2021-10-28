import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'esv7',
  connector: 'esv6',
  index: 'catalog',
  version: 7,
  debug: 'dev', // process.env.APP_ENV === 'dev',
  defaultSize: 50,
  configuration: {
    node: 'http://elasticsearch:9200',
    // node: 'http://localhost:9200',
    // node: process.env.ELASTIC_SEARCH_HOST,
    requestTimeout: 30000, //parseInt(process.env.ELASTIC_SEARCH_REQUEST_TIMEOUT as string),
    pingTimeout: 3000, // parseInt(process.env.ELASTIC_SEARCH_PING_TIMEOUT as string),
  },
  mappingProperties: {
    "docType": {
      "type": "keyword"
    },
    "id": {
      "type": "keyword"
    },
    "name": {
      "type": "text",
      "fields": {
        "keyword": {
          "type": "keyword",
          "ignore_above": 256
        }
      }
    },
    "description": {
      "type": "text",
    },
    "created_at": {
      "type": "date"
    },
    "updated_at": {
      "type": "date"
    },
    "is_active": {
      "type": "boolean"
    },
    "categories": {
      "type": "nested",
      "properties": {
        "id": {"type": "keyword"},
        "name": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "is_active": {"type": "boolean"},
      }
    }
  }
};

console.log('ENV::ELASTIC_SEARCH_HOST=', process.env.ELASTIC_SEARCH_HOST)

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class Esv7DataSource extends juggler.DataSource
  implements LifeCycleObserver {
  [x: string]: any;
  static dataSourceName = 'esv7';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.esv7', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
