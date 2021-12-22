import {
  Client, givenHttpServerConfig
} from '@loopback/testlab';
import supertest from 'supertest';
import {FullcycleNodeCatalogoApplication} from '../..';
import config from '../../../config';

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
  await app.start();

  const client = supertest('http://127.0.0.1:9005');

  return {app, client};
}

export interface AppWithClient {
  app: FullcycleNodeCatalogoApplication;
  client: Client;
}
