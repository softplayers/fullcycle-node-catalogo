import {Client, expect} from '@loopback/testlab';
import {FullcycleNodeCatalogoApplication} from '../..';
import {clearDB, setupApplication} from './test-helper';

describe('Category', () => {
  let app: FullcycleNodeCatalogoApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  beforeEach('Clear DB', clearDB);

  after(async () => {
    await app.stop();
  });

  it('invokes GET /categories', async () => {
    const response = await client
      .get('/categories')
      .expect(200);

    expect(response.body).to.containDeep({
      results: [],
      count: 0,
    })
  });

});
