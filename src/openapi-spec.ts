import {ApplicationConfig} from '@loopback/core';
import {RestServer} from '@loopback/rest';
import {FullcycleNodeCatalogoApplication} from './application';

/**
 * Export the OpenAPI spec from the application
 */
async function exportOpenApiSpec(): Promise<void> {
  const config: ApplicationConfig = {
    rest: {
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST ?? 'localhost',
    },
  };
  const outFile = process.argv[2] ?? '';
  const app = new FullcycleNodeCatalogoApplication(config);
  await app.boot();
  const restServer = app.getSync<RestServer>('servers.RestServer');
  await restServer.exportOpenApiSpec(outFile);
  // await app.exportOpenApiSpec(outFile); // TODO compilation error
}

exportOpenApiSpec().catch(err => {
  console.error('Fail to export OpenAPI spec from the application.', err);
  process.exit(1);
});
