import {
  Client, givenHttpServerConfig
} from '@loopback/testlab';
import supertest from 'supertest';
import {FullcycleNodeCatalogoApplication} from '../..';
import config from '../../../config';
import {config as dbConfig, Esv7DataSource} from '../../datasources/esv7.datasource';

export async function setupApplication(): Promise<AppWithClient> {
  const restConfig = givenHttpServerConfig({
    // Customize the server configuration here.
    // Empty values (undefined, '') will be ignored by the helper.
    //
    // host: process.env.HOST,
    // port: +process.env.PORT,
    port: 9005
  });

  const app = new FullcycleNodeCatalogoApplication({
    ...config,
    rest: restConfig,
  });


  await app.boot();
  app.bind('datasources.esv7').to(testDB);
  await app.start();


  const client = supertest('http://127.0.0.1:9005');

  return {app, client};
}

export const testDB = new Esv7DataSource({
  ...dbConfig,
  index: 'catalog-test',
})

export async function clearDB() {
  await testDB.deleteAllModels(); // deleteAllDocuments(?)
}

export interface AppWithClient {
  app: FullcycleNodeCatalogoApplication;
  client: Client;
}
