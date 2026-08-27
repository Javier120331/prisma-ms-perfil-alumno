import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import { CognitoJwtGuard } from './cognito-jwt.guard';
import { UsersLookupService } from '../services/users-lookup.service';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn().mockReturnValue({}),
  jwtVerify: jest.fn(),
}));

describe('CognitoJwtGuard', () => {
  let guard: CognitoJwtGuard;
  const verifyMock = jwtVerify as jest.MockedFunction<typeof jwtVerify>;
  const usersLookup = { resolve: jest.fn() };

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
    usersLookup.resolve.mockResolvedValue({ colegioId: null });
    guard = new CognitoJwtGuard(
      createConfigService(),
      usersLookup as unknown as UsersLookupService,
    );
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

  it('reads role/colegioId from flat custom:* claims when present', async () => {
    verifyMock.mockResolvedValue({
      payload: {
        sub: 'u1',
        email: 'test@test.com',
        'custom:role': 'ADMIN',
        'custom:colegioId': 'colegio-1',
      },
    } as any);
    const { context, request } = createContext({ authorization: 'Bearer ok' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(usersLookup.resolve).not.toHaveBeenCalled();
    expect(request.user).toEqual({
      id: 'u1',
      email: 'test@test.com',
      role: 'ADMIN',
      appRole: 'ADMIN',
      colegioId: 'colegio-1',
    });
  });

  it('falls back to ms-users when the token has no role claim', async () => {
    verifyMock.mockResolvedValue({ payload: { sub: 'u1' } } as any);
    usersLookup.resolve.mockResolvedValue({
      role: 'TEACHER',
      colegioId: 'colegio-9',
      email: 'teacher@test.com',
    });
    const { context, request } = createContext({ authorization: 'Bearer ok' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(usersLookup.resolve).toHaveBeenCalledWith('u1', 'ok');
    expect(request.user).toEqual({
      id: 'u1',
      email: 'teacher@test.com',
      role: 'TEACHER',
      appRole: 'TEACHER',
      colegioId: 'colegio-9',
    });
  });
});
