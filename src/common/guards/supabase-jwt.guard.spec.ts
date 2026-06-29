import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import { SupabaseJwtGuard } from './supabase-jwt.guard';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn().mockReturnValue({}),
  jwtVerify: jest.fn(),
}));

describe('SupabaseJwtGuard', () => {
  let guard: SupabaseJwtGuard;
  const verifyMock = jwtVerify as jest.MockedFunction<typeof jwtVerify>;

  const createConfigService = () =>
    ({
      getOrThrow: jest.fn().mockReturnValue('https://test.supabase.co'),
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
    guard = new SupabaseJwtGuard(createConfigService());
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
      payload: { sub: 'u1', email: 'test@test.com', role: 'authenticated' },
    } as any);
    const { context, request } = createContext({ authorization: 'Bearer ok' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'u1', email: 'test@test.com', role: 'authenticated', appRole: undefined, colegioId: null });
  });
});
