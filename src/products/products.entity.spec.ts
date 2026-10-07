import { getMetadataArgsStorage } from 'typeorm';
import { Product } from './products.entity';
import { TIMESTAMP } from '../utils/constrants';

describe('Product Entity', () => {
  it('should instantiate Product correctly', () => {
    const product = new Product();
    product.id = 1;
    product.name = 'Test Product';
    product.description = 'Test Description';
    product.price = 99.99;
    product.createdAt = new Date();
    product.updatedAt = new Date();
    product.reviews = [];

    expect(product).toBeDefined();
    expect(product.id).toBe(1);
    expect(product.name).toBe('Test Product');
    expect(product.description).toBe('Test Description');
    expect(product.price).toBe(99.99);
  });

  it('should execute relation and column default functions', () => {
    const storage = getMetadataArgsStorage();

    const relations = storage.relations.filter((r) => r.target === Product);
    expect(relations.length).toBeGreaterThan(0);

    for (const relation of relations) {
      if (typeof relation.type === 'function') {
        const relatedTarget = (relation.type as any)();
        expect(relatedTarget).toBeDefined();
      }
      if (typeof relation.inverseSideProperty === 'function') {
        const dummy = { product: {}, user: {}, products: [], reviews: [] };
        const inverse = (relation.inverseSideProperty as any)(dummy);
        expect(inverse).toBeDefined();
      }
    }

    const columns = storage.columns.filter((c) => c.target === Product);
    for (const col of columns) {
      if (typeof col.options.default === 'function') {
        const defaultValue = (col.options.default as any)();
        expect(defaultValue).toBe(TIMESTAMP);
      }
    }
  });
});
