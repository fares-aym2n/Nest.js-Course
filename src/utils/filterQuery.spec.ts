import { filterObj } from './filterQuery';
import {
  Between,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
} from 'typeorm';

describe('filterObj', () => {
  it('should return empty object when no parameters are provided', () => {
    const result = filterObj();
    expect(result).toEqual({});
  });

  it('should return name filter with lowercase like query when only name is provided', () => {
    const result = filterObj('PHONE');
    expect(result).toEqual({
      name: Like('%phone%'),
    });
  });

  it('should return price Between filter when both minPrice and maxPrice are provided', () => {
    const result = filterObj(undefined, '10', '100');
    expect(result).toEqual({
      price: Between(10, 100),
    });
  });

  it('should return price MoreThanOrEqual filter when only minPrice is provided', () => {
    const result = filterObj(undefined, '50', undefined);
    expect(result).toEqual({
      price: MoreThanOrEqual(50),
    });
  });

  it('should return price LessThanOrEqual filter when only maxPrice is provided', () => {
    const result = filterObj(undefined, undefined, '200');
    expect(result).toEqual({
      price: LessThanOrEqual(200),
    });
  });

  it('should combine name and price Between filter when all parameters are provided', () => {
    const result = filterObj('Book', '15', '45');
    expect(result).toEqual({
      name: Like('%book%'),
      price: Between(15, 45),
    });
  });

  it('should combine name and minPrice when maxPrice is not provided', () => {
    const result = filterObj('Chair', '80', undefined);
    expect(result).toEqual({
      name: Like('%chair%'),
      price: MoreThanOrEqual(80),
    });
  });

  it('should combine name and maxPrice when minPrice is not provided', () => {
    const result = filterObj('Table', undefined, '300');
    expect(result).toEqual({
      name: Like('%table%'),
      price: LessThanOrEqual(300),
    });
  });
});
