import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { payloadTypes } from '../../utils/payload';
import { Reflector } from '@nestjs/core';
import { UserService } from '../users.service';
import { UserTypes } from '../../utils/user-types';
@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private config: ConfigService,
    private jwtService: JwtService,
    private reflector: Reflector,
    private userService: UserService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const roles: UserTypes[] = this.reflector.getAllAndOverride(
      'roles',
      [context.getHandler(), context.getClass()],
    );
    if (!roles || roles.length == 0) return false;

    const request: Request = context.switchToHttp().getRequest();
    const [type, token] =
      request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      try {
        const payload: payloadTypes =
          await this.jwtService.verifyAsync(token, {
            secret: this.config.get<string>('JWT_SECRET'),
          });

        const user = await this.userService.getCurrentUser(
          payload.id,
        );
        if (!user) return false;
        if (roles.includes(user.role)) {
          request['user'] = payload;
          return true;
        }
        return false;
      } catch {
        throw new UnauthorizedException(
          'Token is invalid or expired. Please login and try again',
        );
      }
    } else {
      throw new UnauthorizedException(
        'Token is not provided. Please login and try again',
      );
    }
  }
}
