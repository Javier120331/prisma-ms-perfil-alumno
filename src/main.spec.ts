import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

describe('bootstrap', () => {
  it('configures app with cors, validation, and listener', async () => {
    const app = {
      enableCors: jest.fn(),
      useGlobalPipes: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(app);

    jest.isolateModules(() => {
      require('./main');
    });

    await new Promise(process.nextTick);

    expect(app.enableCors).toHaveBeenCalled();
    expect(app.useGlobalPipes).toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalled();

    const pipe = (app.useGlobalPipes as jest.Mock).mock.calls[0][0];
    expect(pipe).toBeDefined();
    expect(pipe.constructor.name).toBe('ValidationPipe');
  });
});
