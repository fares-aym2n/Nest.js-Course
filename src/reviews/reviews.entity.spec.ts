import { getMetadataArgsStorage } from 'typeorm';
import { Review } from './reviews.entity';
import { TIMESTAMP } from '../utils/constrants';

describe('Review Entity', () => {
  it('should instantiate Review correctly', () => {
    const review = new Review();
    review.id = 1;
    review.review = 'Awesome';
    review.rating = 5;
    review.createdAt = new Date();
    review.updatedAt = new Date();

    expect(review).toBeDefined();
    expect(review.id).toBe(1);
    expect(review.review).toBe('Awesome');
    expect(review.rating).toBe(5);
  });

  it('should execute relation and column default functions', () => {
    const storage = getMetadataArgsStorage();

    const relations = storage.relations.filter((r) => r.target === Review);
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

    const columns = storage.columns.filter((c) => c.target === Review);
    for (const col of columns) {
      if (typeof col.options.default === 'function') {
        const defaultValue = (col.options.default as any)();
        expect(defaultValue).toBe(TIMESTAMP);
      }
    }
  });
});
