import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './products.entity';
import { ProductService } from './products.service';
import { createProductDTO } from './dto/create-product.dto';
import { Repository } from 'typeorm';

type optionsTypes = {
  where: {
    name?: string;
    minPrice?: number;
    maxPrice?: number;
  };
  skip: number;
  take: number;
};

type productsTypes = {
  id: number;
  name: string;
  descrbtion: string;
  price: number;
};

type findOneObj = {
  where: { id: number };
  relations: { user: boolean; reviews: boolean };
};

describe('Product Service', () => {
  let productService: ProductService;
  let productsRepository: Repository<Product>;

  const createDto: createProductDTO = {
    name: 'book',
    description: 'I love it',
    price: 1000,
  };
  let products: productsTypes[];
  const REPOSITORY_TOKEN = getRepositoryToken(Product);
  beforeEach(async () => {
    products = [
      {
        id: 1,
        name: 'book fares',
        descrbtion: 'I love it',
        price: 1000,
      },
      {
        id: 2,
        name: 'book ali',
        descrbtion: 'I love it',
        price: 1000,
      },
      {
        id: 3,
        name: 'stove',
        descrbtion: 'I love it',
        price: 1000,
      },
      {
        id: 4,
        name: 'TV',
        descrbtion: 'I love it',
        price: 1000,
      },
      {
        id: 5,
        name: 'Playstation',
        descrbtion: 'I love it',
        price: 1000,
      },
    ];
    const module: TestingModule = await Test.createTestingModule(
      {
        providers: [
          ProductService,
          {
            provide: UserService,
            useValue: {
              getCurrentUser: jest.fn((userId) =>
                Promise.resolve({
                  id: userId,
                }),
              ),
            },
          },
          {
            provide: REPOSITORY_TOKEN,
            useValue: {
              create: jest.fn((dto: createProductDTO) => dto),
              save: jest.fn((dto: createProductDTO) =>
                Promise.resolve({ ...dto, id: 1 }),
              ),
              find: jest.fn((options: optionsTypes) => {
                if (options.where.name)
                  return Promise.resolve([
                    products[0],
                    products[1],
                  ]);
                return Promise.resolve(products);
              }),
              findOne: jest.fn((findoneObj: findOneObj) =>
                Promise.resolve(
                  products.find(
                    (p) => findoneObj.where.id === p.id,
                  ),
                ),
              ),
              remove: jest.fn((product: productsTypes) => {
                const index = products.indexOf(product);
                if (index !== -1) {
                  return Promise.resolve(
                    products.splice(index, 1),
                  );
                }
              }),
            },
          },
        ],
      },
    ).compile();
    productService = module.get<ProductService>(ProductService);
    productsRepository =
      module.get<Repository<Product>>(REPOSITORY_TOKEN);
  });

  test('productService is not defined', () => {
    expect(productService).toBeDefined();
  });
  test('productsRepository is not defined', () => {
    expect(productsRepository).toBeDefined();
  });

  // Create Product
  describe('Create Product', () => {
    test("should call 'create' method in productsRepository", async () => {
      await productService.createOne(createDto, 1);
      expect(productsRepository.create).toHaveBeenCalled();
      expect(productsRepository.create).toHaveBeenCalledTimes(1);
    });
    test("should call 'save' method in productsRepository", async () => {
      await productService.createOne(createDto, 1);
      expect(productsRepository.save).toHaveBeenCalled();
      expect(productsRepository.save).toHaveBeenCalledTimes(1);
    });
    test('should create a new product', async () => {
      const result = await productService.createOne(
        createDto,
        1,
      );
      expect(result).toBeDefined();
      expect(result.name).toBe('book');
      expect(result.id).toBe(1);
    });
  });

  // Find All Product
  describe('Find all products', () => {
    test("should call 'find' method in product service", async () => {
      await productService.getAll(1);
      expect(productsRepository.find).toHaveBeenCalled();
      expect(productsRepository.find).toHaveBeenCalledTimes(1);
    });

    test('should return 2 product if argument 2 bassed', async () => {
      const OBJ = await productService.getAll(1, 'book');
      expect(OBJ.products).toHaveLength(2);
    });
    test('should return all products if argument 2 not bassed', async () => {
      const OBJ = await productService.getAll(1);
      expect(OBJ.products).toHaveLength(5);
      expect(OBJ.products).toBe(products);
    });
  });

  // Find One Product
  describe('Find one product', () => {
    test("should call 'findOne' method in productService", async () => {
      await productService.getOneBy(1);
      expect(productsRepository.findOne).toHaveBeenCalled();
      expect(productsRepository.findOne).toHaveBeenCalledTimes(
        1,
      );
    });

    test('should retrun product', async () => {
      const product = await productService.getOneBy(1);
      expect(product).toMatchObject(product);
    });
    test('thow an error if product not found', async () => {
      expect.assertions(1);

      try {
        await productService.getOneBy(20);
      } catch (error) {
        expect(error).toMatchObject({
          message: 'Product is not found',
        });
      }
    });
  });

  // Update Product
  describe('Update One Product', () => {
    const name = 'Product Updated';
    test("should call 'save' method in product service", async () => {
      await productService.updateOneBy(1, {
        name,
      });
      expect(productsRepository.save).toHaveBeenCalled();
      expect(productsRepository.save).toHaveBeenCalledTimes(1);
    });

    test('update the product in product service', async () => {
      const product = await productService.updateOneBy(1, {
        name,
      });
      expect(product).toMatchObject(product);
    });

    test('thow an error if product not found', async () => {
      expect.assertions(1);
      try {
        await productService.updateOneBy(20, { name });
      } catch (error) {
        expect(error).toMatchObject({
          message: 'Product is not found',
        });
      }
    });

    test('update the product with price and description', async () => {
      const product = await productService.updateOneBy(1, {
        price: 999,
        description: 'New Description',
      });
      expect(product.price).toBe(999);
      expect(product.description).toBe('New Description');
    });
  });

  // Delete Product
  describe('delete One Product', () => {
    test("should call 'save' method in product service", async () => {
      await productService.deleteOneBy(1);
      expect(productsRepository.remove).toHaveBeenCalled();
      expect(productsRepository.remove).toHaveBeenCalledTimes(1);
    });

    test('should delete the product', async () => {
      const product = await productService.deleteOneBy(1);
      expect(product).toMatchObject({
        message: 'Product deleted successfuly',
      });
    });

    test('thow an error if product not found', async () => {
      expect.assertions(1);
      try {
        await productService.deleteOneBy(20);
      } catch (error) {
        expect(error).toMatchObject({
          message: 'Product is not found',
        });
      }
    });
  });
});
