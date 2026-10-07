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
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private config: ConfigService,
    private jwtService: JwtService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    const [type, token] =
      request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      try {
        const payload: payloadTypes =
          await this.jwtService.verifyAsync(token, {
            secret: this.config.get<string>('JWT_SECRET'),
          });
        request['user'] = payload;
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
    return true;
  }
}
