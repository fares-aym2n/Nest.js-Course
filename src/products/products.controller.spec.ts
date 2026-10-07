import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './products.controller';
import { ProductService } from './products.service';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { createProductDTO } from './dto/create-product.dto';
import { payloadTypes } from '../utils/payload';
import { UserTypes } from '../utils/user-types';
import { NotFoundException } from '@nestjs/common';
import { updateProductTDO } from './dto/update-product.dto';

type productsTypes = {
  id: number;
  name: string;
  descrbtion: string;
  price: number;
};

describe('Product Controller', () => {
  let productController: ProductController;
  let productService: ProductService;

  const createProduct: createProductDTO = {
    name: 'Book',
    description: 'I Love It',
    price: 1000,
  };

  const currentUser: payloadTypes = {
    id: 1,
    role: UserTypes.ADMIN,
  };

  beforeEach(async () => {
    let products: productsTypes[];
    products = [
      {
        id: 1,
        name: 'book',
        descrbtion: 'I love it',
        price: 1000,
      },
      {
        id: 2,
        name: 'book ',
        descrbtion: 'I love it',
        price: 1200,
      },
      {
        id: 3,
        name: 'stove',
        descrbtion: 'I love it',
        price: 1500,
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
        controllers: [ProductController],
        providers: [
          { provide: ConfigService, useValue: {} },
          { provide: UserService, useValue: {} },
          { provide: JwtService, useValue: {} },
          {
            provide: ProductService,
            useValue: {
              createOne: jest.fn(
                (dto: createProductDTO, userId: number) =>
                  Promise.resolve({ ...dto, id: userId }),
              ),
              getAll: jest.fn(
                (
                  page: number,
                  name: string,
                  minPrice: number,
                  maxPrice: number,
                ) => {
                  if (name)
                    return Promise.resolve(
                      products.filter((p) => p.name === name),
                    );

                  if (minPrice && maxPrice)
                    return Promise.resolve(
                      products.filter(
                        (p) =>
                          p.price <= maxPrice &&
                          p.price >= minPrice,
                      ),
                    );
                  return Promise.resolve(products);
                },
              ),

              getOneBy: jest.fn((id: number) => {
                const product = products.find(
                  (p) => p.id === id,
                );
                if (!product)
                  throw new NotFoundException(
                    'Product is not found',
                  );
                return Promise.resolve(product);
              }),

              updateOneBy: jest.fn(
                (id: number, dto: updateProductTDO) =>
                  Promise.resolve({ ...dto, id }),
              ),
              deleteOneBy: jest.fn((id: number) => true),
            },
          },
        ],
      },
    ).compile();
    productController = module.get<ProductController>(
      ProductController,
    );
    productService = module.get<ProductService>(ProductService);
  });

  test('should product controller to be defined', () => {
    expect(productController).toBeDefined();
  });

  test('should product service to be defined', () => {
    expect(productService).toBeDefined();
  });

  describe('create product', () => {
    test("should calll 'createOne' method", async () => {
      await productController.createProduct(
        createProduct,
        currentUser,
      );
      expect(productService.createOne).toHaveBeenCalled();
      expect(productService.createOne).toHaveBeenCalledTimes(1);
      expect(productService.createOne).toHaveBeenCalledWith(
        createProduct,
        currentUser.id,
      );
    });

    test('should return new product with given data', async () => {
      const product = await productController.createProduct(
        createProduct,
        currentUser,
      );
      expect(product).toMatchObject(createProduct);
      expect(product.id).toBe(1);
    });
  });

  describe('get all products', () => {
    test('should call get all products method', async () => {
      await productController.getAllProducts(1);
      expect(productService.getAll).toHaveBeenCalled();
      expect(productService.getAll).toHaveBeenCalledTimes(1);
    });
    test('should return products based on name', async () => {
      const products = await productController.getAllProducts(
        1,
        'book',
      );
      expect(products).toHaveLength(1);
    });
    test('should return 2 products min & max price', async () => {
      const products = await productController.getAllProducts(
        1,
        undefined,
        '1200',
        '1600',
      );
      expect(products).toHaveLength(2);
    });
    test('should all products', async () => {
      const products = await productController.getAllProducts(1);
      expect(products).toHaveLength(5);
    });
  });

  describe('get product by id', () => {
    test("should call 'getOneBy' method", async () => {
      await productController.getProduct(1);
      expect(productService.getOneBy).toHaveBeenCalled();
      expect(productService.getOneBy).toHaveBeenCalledTimes(1);
      expect(productService.getOneBy).toHaveBeenCalledWith(1);
    });
    test('should return Product based on id', async () => {
      const product = await productController.getProduct(1);
      expect(product.id).toBe(1);
    });
    test('should throw an error', async () => {
      try {
        await productController.getProduct(20);
      } catch (error) {
        expect(error).toMatchObject({
          message: 'Product is not found',
        });
      }
    });
  });

  describe('update product by id', () => {
    const name = 'update Product';
    test("should call 'updateOneBy' method", async () => {
      await productController.updateProduct(1, { name });
      expect(productService.updateOneBy).toHaveBeenCalled();
      expect(productService.updateOneBy).toHaveBeenCalledTimes(
        1,
      );
      expect(productService.updateOneBy).toHaveBeenCalledWith(
        1,
        { name },
      );
    });
    test('should update product by id', async () => {
      const product = await productController.updateProduct(1, {
        name,
      });
      expect(product.name).toBe(name);
      expect(product.id).toBe(1);
    });
  });

  describe('delete product by id', () => {
    test("should call 'deleteOneBy' method", async () => {
      await productController.deleteProduct(1);
      expect(productService.deleteOneBy).toHaveBeenCalled();
      expect(productService.deleteOneBy).toHaveBeenCalledTimes(
        1,
      );
      expect(productService.deleteOneBy).toHaveBeenCalledWith(1);
    });
  });
});
