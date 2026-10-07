import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './auth.decorator';
import { Roles } from './user-roles.decorator';
import { UserTypes } from '../../utils/user-types';
import { Reflector } from '@nestjs/core';

function getParamDecoratorFactory(decorator: Function) {
  class TestController {
    testMethod(@decorator() _value: any) {}
  }
  const args = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'testMethod',
  );
  return args[Object.keys(args)[0]].factory;
}

describe('Decorators', () => {
  describe('CurrentUser Decorator', () => {
    it('should extract user from request context', () => {
      const factory = getParamDecoratorFactory(CurrentUser);

      const mockUser = {
        id: 42,
        role: UserTypes.ADMIN,
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: mockUser,
          }),
        }),
      } as ExecutionContext;

      const result = factory(null, mockExecutionContext);

      expect(result).toEqual(mockUser);
    });

    it('should return undefined if user is not set on request', () => {
      const factory = getParamDecoratorFactory(CurrentUser);

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as ExecutionContext;

      const result = factory(null, mockExecutionContext);

      expect(result).toBeUndefined();
    });
  });

  describe('Roles Decorator', () => {
    it('should set metadata for roles', () => {
      class TestRolesClass {
        @Roles(UserTypes.ADMIN, UserTypes.USER)
        testEndpoint() {}
      }

      const reflector = new Reflector();
      const roles = reflector.get<UserTypes[]>(
        'roles',
        TestRolesClass.prototype.testEndpoint,
      );

      expect(roles).toEqual([UserTypes.ADMIN, UserTypes.USER]);
    });
  });
});
