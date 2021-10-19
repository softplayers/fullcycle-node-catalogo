export class FixturesCommand {
  static readonly command = 'fixtures';
  static readonly description = 'Fixtures data in ElasticSearch';
  async run() {
    console.log('fixtures executing');
    throw new Error("fixtures executing error");
  };
}
