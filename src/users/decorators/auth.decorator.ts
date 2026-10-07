import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { payloadTypes } from '../../utils/payload';

export const CurrentUser = createParamDecorator(
  (data, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const payload: payloadTypes = request['user'];
    return payload;
  },
);
