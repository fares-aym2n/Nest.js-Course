import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { Product } from '../src/products/products.entity';
import { createProductDTO } from '../src/products/dto/create-product.dto';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/users.entity';
import { UserTypes } from '../src/utils/user-types';

describe('Prodcut Controller e2e', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let products: createProductDTO[];
  let token: string;
  let dto: createProductDTO = {
    name: 'playstation',
    description: 'I Like It',
    price: 1000,
  };
  beforeEach(async () => {
    products = [
      { name: 'book', description: 'I Love It', price: 1000 },
      { name: 'stove', description: 'I Love It', price: 1200 },
      { name: 'tv', description: 'I Love It', price: 300 },
      {
        name: 'playstation',
        description: 'I Love It',
        price: 1500,
      },
    ];

    const module: TestingModule = await Test.createTestingModule(
      {
        imports: [AppModule],
      },
    ).compile();
    app = module.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);

    // Sign up
    const hashePassword = await bcrypt.hash('test1234', 10);
    dataSource
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          username: 'fares',
          email: 'test@gmail.com',
          password: hashePassword,
          isEmailValidation: true,
          role: UserTypes.ADMIN,
        },
      ])
      .execute();

    // Login User
    const { body } = await request(app.getHttpServer())
      .post('/api/users/auth/login')
      .send({ email: 'test@gmail.com', password: 'test1234' });
    token = body.token;
  });
  afterEach(async () => {
    await dataSource
      .createQueryBuilder()
      .delete()
      .from(Product)
      .execute();

    await dataSource
      .createQueryBuilder()
      .delete()
      .from(User)
      .execute();
    await app.close();
  });

  describe('Get', () => {
    beforeEach(async () => {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(Product)
        .values(products)
        .execute();
    });
    test('shuold return products based on page number', async () => {
      const result = await request(app.getHttpServer()).get(
        '/api/products?page=1',
      );
      expect(result.status).toBe(200);
      expect(result.body.products).toHaveLength(4);
    });

    test('shuold return products based on page number & name', async () => {
      const result = await request(app.getHttpServer()).get(
        '/api/products?page=1&name=book',
      );
      expect(result.status).toBe(200);
      expect(result.body.products).toHaveLength(1);
    });

    test('shuold return products based on page number & name & minPrice & maxPrice', async () => {
      const result = await request(app.getHttpServer()).get(
        '/api/products?page=1&minPrice=1100&maxPrice=1600',
      );
      expect(result.status).toBe(200);
      expect(result.body.products).toHaveLength(2);
    });
  });

  describe('Post', () => {
    test('expect return product', async () => {
      const result = await request(app.getHttpServer())
        .post('/api/products')
        .send(dto)
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(201);
      expect(result.body).toMatchObject(dto);
    });

    test('expect return return status code 400 if name is less than 3 char', async () => {
      dto.name = 'pc';
      const result = await request(app.getHttpServer())
        .post('/api/products')
        .send(dto)
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(400);
    });

    test('expect return return status code 400 if price is lessthan 5', async () => {
      dto.price = 4;
      const result = await request(app.getHttpServer())
        .post('/api/products')
        .send(dto)
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(400);
    });

    test('expect return status code 401 if not provide token', async () => {
      const result = await request(app.getHttpServer())
        .post('/api/products')
        .send(dto);
      expect(result.status).toBe(401);
    });
  });

  describe('Get /:id', () => {
    test('return product based on id', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Book',
          description: 'I Like It',
          price: 1000,
        })
        .set('Authorization', `Bearer ${token}`);
      const response = await request(app.getHttpServer()).get(
        `/api/products/${body.id}`,
      );
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(body.id);
    });

    test('retun status code 404 if product not found', async () => {
      const response = await request(app.getHttpServer()).get(
        `/api/products/1`,
      );
      expect(response.status).toBe(404);
    });
    test('retun status code 400 if product id is invalid', async () => {
      const response = await request(app.getHttpServer()).get(
        `/api/products/abc`,
      );
      expect(response.status).toBe(400);
    });
  });

  describe('Patch /:id', () => {
    test('updated product based on id', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Book',
          description: 'I Like It',
          price: 1000,
        })
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app.getHttpServer())
        .patch(`/api/products/${body.id}`)
        .send({ name: 'updated' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(body.id);
      expect(response.body.name).toBe('updated');
    });

    test('retun status code 404 if product not found', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/products/100`)
        .send({ name: 'Updated' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test('retun status code 400 if product id is invalid', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/products/abc`)
        .send({ name: 'updated' })
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(400);
    });

    test('retun status code 400 if product name less than 3 char', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Book',
          description: 'I Like It',
          price: 1000,
        })
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app.getHttpServer())
        .patch(`/api/products/${body.id}`)
        .send({ name: 'Up' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Delete /:id', () => {
    test('delete product based on id', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Book',
          description: 'I Like It',
          price: 1000,
        })
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app.getHttpServer())
        .delete(`/api/products/${body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    test('retun status code 404 if product not found', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/products/100`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test('retun status code 400 if product id is invalid', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/products/abc`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(400);
    });

    test('retun status code 401 if token is not provide', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Book',
          description: 'I Like It',
          price: 1000,
        })
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app.getHttpServer())
        .delete(`/api/products/${body.id}`)
        .send({ name: 'Up' });

      expect(response.status).toBe(401);
    });
  });
});
