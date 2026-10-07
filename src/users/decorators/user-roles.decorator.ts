import { SetMetadata } from '@nestjs/common';
import { UserTypes } from '../../utils/user-types';

export const Roles = (...roles: UserTypes[]) =>
  SetMetadata('roles', roles);
