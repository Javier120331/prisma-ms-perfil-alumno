import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import { CognitoJwtGuard } from './supabase-jwt.guard';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn().mockReturnValue({}),
  jwtVerify: jest.fn(),
}));

describe('CognitoJwtGuard', () => {
  let guard: CognitoJwtGuard;
  const verifyMock = jwtVerify as jest.MockedFunction<typeof jwtVerify>;

  const createConfigService = () =>
    ({
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'COGNITO_REGION') return 'us-east-1';
        return undefined;
      }),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        if (key === 'COGNITO_USER_POOL_ID') return 'us-east-1_XXXXXXXXX';
        throw new Error(`Missing config: ${key}`);
      }),
    }) as unknown as ConfigService;

  const createContext = (headers: Record<string, string | undefined>) => {
    const request: Record<string, unknown> = { headers };
    return {
      context: {
        switchToHttp: () => ({ getRequest: () => request }),
      } as any,
      request,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new CognitoJwtGuard(createConfigService());
  });

  it('rejects when header is missing', async () => {
    const { context } = createContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when token verification fails', async () => {
    verifyMock.mockRejectedValue(new Error('invalid'));
    const { context } = createContext({ authorization: 'Bearer bad' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('accepts valid token and attaches user', async () => {
    verifyMock.mockResolvedValue({
      payload: { sub: 'u1', email: 'test@test.com', custom: { role: 'ADMIN', colegioId: 'colegio-1' } },
    } as any);
    const { context, request } = createContext({ authorization: 'Bearer ok' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({
      id: 'u1',
      email: 'test@test.com',
      role: 'ADMIN',
      appRole: 'ADMIN',
      colegioId: 'colegio-1',
    });
  });
});
