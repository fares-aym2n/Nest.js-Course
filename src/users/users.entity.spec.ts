import { getMetadataArgsStorage } from 'typeorm';
import { User } from './users.entity';
import { UserTypes } from '../utils/user-types';
import { TIMESTAMP } from '../utils/constrants';

describe('User Entity', () => {
  it('should instantiate User correctly with default values', () => {
    const user = new User();
    user.id = 1;
    user.username = 'alice';
    user.email = 'alice@example.com';
    user.password = 'hashed123';
    user.role = UserTypes.USER;
    user.isEmailValidation = true;
    user.profile_image = null;
    user.verificationToken = null;
    user.resetPasswordToken = null;
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.products = [];
    user.reviews = [];

    expect(user).toBeDefined();
    expect(user.id).toBe(1);
    expect(user.username).toBe('alice');
    expect(user.email).toBe('alice@example.com');
  });

  it('should execute relation and column default functions', () => {
    const storage = getMetadataArgsStorage();

    const relations = storage.relations.filter((r) => r.target === User);
    expect(relations.length).toBeGreaterThan(0);

    for (const relation of relations) {
      if (typeof relation.type === 'function') {
        const relatedTarget = (relation.type as any)();
        expect(relatedTarget).toBeDefined();
      }
      if (typeof relation.inverseSideProperty === 'function') {
        const dummy = { user: {} };
        const inverse = (relation.inverseSideProperty as any)(dummy);
        expect(inverse).toBeDefined();
      }
    }

    const columns = storage.columns.filter((c) => c.target === User);
    for (const col of columns) {
      if (typeof col.options.default === 'function') {
        const defaultValue = (col.options.default as any)();
        expect(defaultValue).toBe(TIMESTAMP);
      }
    }
  });
});
