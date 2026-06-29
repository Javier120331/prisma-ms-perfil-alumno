import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController health', () => {
  it('returns ok status', () => {
    const controller = new AppController(new AppService());

    expect(controller.health()).toEqual({ status: 'ok' });
  });
});
