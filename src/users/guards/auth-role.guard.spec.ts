import { Test, TestingModule } from '@nestjs/testing';
import { AuthRolesGuard } from './auth-role.guard';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { UserService } from '../users.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserTypes } from '../../utils/user-types';
import { payloadTypes } from '../../utils/payload';

describe('AuthRolesGuard', () => {
  let guard: AuthRolesGuard;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'secret';
      return null;
    }),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockUserService = {
    getCurrentUser: jest.fn(),
  };

  const createMockExecutionContext = (headers: Record<string, string> = {}): {
    context: ExecutionContext;
    request: any;
  } => {
    const handler = () => {};
    const targetClass = class {};

    const request = {
      headers,
    };

    const context = {
      getHandler: () => handler,
      getClass: () => targetClass,
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
        AuthRolesGuard,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: Reflector, useValue: mockReflector },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    guard = module.get<AuthRolesGuard>(AuthRolesGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return false if no roles are configured on handler or class', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(null);
    const { context } = createMockExecutionContext();

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should return false if roles array is empty', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([]);
    const { context } = createMockExecutionContext();

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should throw UnauthorizedException if authorization header is missing', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserTypes.ADMIN]);
    const { context } = createMockExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Token is not provided. Please login and try again',
      ),
    );
  });

  it('should throw UnauthorizedException if header is not Bearer', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserTypes.ADMIN]);
    const { context } = createMockExecutionContext({
      authorization: 'Token 12345',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Token is not provided. Please login and try again',
      ),
    );
  });

  it('should throw UnauthorizedException if token verification fails', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserTypes.ADMIN]);
    const { context } = createMockExecutionContext({
      authorization: 'Bearer bad.token',
    });
    mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Token is invalid or expired. Please login and try again',
      ),
    );
  });

  it('should return false if user is not found in database', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserTypes.ADMIN]);
    const { context } = createMockExecutionContext({
      authorization: 'Bearer valid.token',
    });
    const payload: payloadTypes = { id: 1, role: UserTypes.USER };
    mockJwtService.verifyAsync.mockResolvedValue(payload);
    mockUserService.getCurrentUser.mockResolvedValue(null);

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should return false if user role is not in allowed roles', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserTypes.ADMIN]);
    const { context } = createMockExecutionContext({
      authorization: 'Bearer valid.token',
    });
    const payload: payloadTypes = { id: 1, role: UserTypes.USER };
    mockJwtService.verifyAsync.mockResolvedValue(payload);
    mockUserService.getCurrentUser.mockResolvedValue({
      id: 1,
      role: UserTypes.USER,
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should return true and attach user to request when user role matches allowed roles', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([
      UserTypes.ADMIN,
      UserTypes.USER,
    ]);
    const { context, request } = createMockExecutionContext({
      authorization: 'Bearer valid.token',
    });
    const payload: payloadTypes = { id: 2, role: UserTypes.ADMIN };
    mockJwtService.verifyAsync.mockResolvedValue(payload);
    mockUserService.getCurrentUser.mockResolvedValue({
      id: 2,
      role: UserTypes.ADMIN,
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual(payload);
  });
});
