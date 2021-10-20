import {RestServer} from '@loopback/rest';
import {ApplicationConfig, FullcycleNodeCatalogoApplication} from './application';
import './bootstrap';

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  const app = new FullcycleNodeCatalogoApplication(options);
  await app.boot();
  await app.start();

  const restServer = app.getSync<RestServer>('servers.RestServer');
  const url = restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

const config = require('../config');
if (require.main === module) {
  // Run the application
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
