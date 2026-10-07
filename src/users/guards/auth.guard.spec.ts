import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { payloadTypes } from '../../utils/payload';
import { UserTypes } from '../../utils/user-types';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'my-secret-key';
      return null;
    }),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const createMockExecutionContext = (headers: Record<string, string> = {}): {
    context: ExecutionContext;
    request: any;
  } => {
    const request = {
      headers,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    return { context, request };
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException if authorization header is missing', async () => {
    const { context } = createMockExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Token is not provided. Please login and try again',
      ),
    );
  });

  it('should throw UnauthorizedException if header is not Bearer type', async () => {
    const { context } = createMockExecutionContext({
      authorization: 'Basic some-credentials',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Token is not provided. Please login and try again',
      ),
    );
  });

  it('should throw UnauthorizedException if token is missing after Bearer', async () => {
    const { context } = createMockExecutionContext({
      authorization: 'Bearer ',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Token is not provided. Please login and try again',
      ),
    );
  });

  it('should throw UnauthorizedException if jwt verification fails', async () => {
    const { context } = createMockExecutionContext({
      authorization: 'Bearer invalid.token',
    });
    mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Token is invalid or expired. Please login and try again',
      ),
    );
    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('invalid.token', {
      secret: 'my-secret-key',
    });
  });

  it('should verify token, attach user to request, and return true for valid token', async () => {
    const mockPayload: payloadTypes = {
      id: 1,
      role: UserTypes.USER,
    };
    mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

    const { context, request } = createMockExecutionContext({
      authorization: 'Bearer valid.jwt.token',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid.jwt.token', {
      secret: 'my-secret-key',
    });
    expect(request.user).toEqual(mockPayload);
  });
});
