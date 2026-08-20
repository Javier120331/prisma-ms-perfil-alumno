describe('database.config', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('reads values from env', async () => {
    process.env.DATABASE_URL = 'postgresql://example/db';
    process.env.PORT = '4567';
    process.env.NODE_ENV = 'test';

    const config = require('./database.config');

    expect(config.databaseConfig.url).toBe('postgresql://example/db');
    expect(config.appConfig.port).toBe('4567');
    expect(config.appConfig.env).toBe('test');
  });
});
