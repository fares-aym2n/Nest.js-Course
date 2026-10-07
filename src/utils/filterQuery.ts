import {
  Like,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';

export const filterObj = (
  name?: string,
  minPrice?: string,
  maxPrice?: string,
) => {
  return {
    ...(name ? { name: Like(`%${name.toLowerCase()}%`) } : {}),
    ...(minPrice && maxPrice
      ? {
          price: Between(parseInt(minPrice), parseInt(maxPrice)),
        }
      : minPrice
        ? { price: MoreThanOrEqual(parseInt(minPrice)) }
        : maxPrice
          ? { price: LessThanOrEqual(parseInt(maxPrice)) }
          : {}),
  };
};
