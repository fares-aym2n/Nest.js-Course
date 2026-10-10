import {INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/users.entity';
import { UserTypes } from '../src/utils/user-types';
import { createReviewDTO } from '../src/reviews/dto/create-reviews.dto';
import { Review } from '../src/reviews/reviews.entity';
import { Product } from '../src/products/products.entity';

describe('Review Controller e2e', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let reviews: createReviewDTO[];
  let token: string;
  const dto: createReviewDTO = {
    review: 'I like it',
    rating: 4.3,
  };
  let productId: number;
  beforeEach(async () => {
    reviews = [
      { review: 'I like it', rating: 4 },
      { review: 'I like it', rating: 4 },
      { review: 'I like it', rating: 4 },
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

    const productResponse = await request(app.getHttpServer())
      .post(`/api/products`)
      .send({
        name: 'IPhone',
        description: 'I Like it ',
        price: 1000,
      })
      .set('Authorization', `Bearer ${token}`);
    productId = productResponse.body.id;
  });
  afterEach(async () => {
    await dataSource
      .createQueryBuilder()
      .delete()
      .from(Review)
      .execute();

    await dataSource
      .createQueryBuilder()
      .delete()
      .from(User)
      .execute();

    await dataSource
      .createQueryBuilder()
      .delete()
      .from(Product)
      .execute();
    await app.close();
  });

  describe('Get', () => {
    beforeEach(async () => {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(Review)
        .values(reviews)
        .execute();
    });
    test('shuold return all reviews', async () => {
      const result = await request(app.getHttpServer()).get(
        '/api/reviews',
      );
      expect(result.status).toBe(200);
      expect(result.body.reviews).toHaveLength(3);
    });
  });

  describe('Post', () => {
    beforeEach(async () => {});
    test('should  create review', async () => {
      const result = await request(app.getHttpServer())
        .post(`/api/reviews/${productId}`)
        .send(dto)
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(201);
      expect(result.body.id).toBeDefined();
      expect(result.body).toMatchObject(dto);
    });

    test('should return return status code 400 if rating is less than 1 or greater than 5', async () => {
      const result = await request(app.getHttpServer())
        .post(`/api/reviews/${productId}`)
        .send({ ...dto, rating: 10 })
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(400);
    });

    test('shuold return status code 401 if not provide token', async () => {
      const result = await request(app.getHttpServer())
        .post(`/api/reviews/${productId}`)
        .send(dto);
      expect(result.status).toBe(401);
    });
  });

  describe('Get /:id', () => {
    test('return review based on id', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/api/reviews/${productId}`)
        .send(dto)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app.getHttpServer()).get(
        `/api/reviews/${body.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(body.id);
    });

    test('retun status code 404 if review not found', async () => {
      const response = await request(app.getHttpServer()).get(
        `/api/reviews/1`,
      );
      expect(response.status).toBe(404);
    });

    test('retun status code 400 if review id is invalid', async () => {
      const response = await request(app.getHttpServer()).get(
        `/api/reviews/abc`,
      );
      expect(response.status).toBe(400);
    });
  });

  describe('Patch /:id', () => {
    test('updated review based on id', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/api/reviews/${productId}`)
        .send(dto)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app.getHttpServer())
        .patch(`/api/reviews/${body.id}`)
        .send({ review: 'updated' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(body.id);
      expect(response.body.review).toBe('updated');
    });

    test('retun status code 404 if review not found', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/review/100`)
        .send({ review: 'updated' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test('retun status code 400 if review id is invalid', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/reviews/abc`)
        .send({ review: 'updated' })
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(400);
    });

    test('retun status code 400 if review rating less than 1 or greater than 10', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/api/reviews/${productId}`)
        .send(dto)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app.getHttpServer())
        .patch(`/api/reviews/${body.id}`)
        .send({ rating: 9 })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Delete /:id', () => {
    test('delete review based on id', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/api/reviews/${productId}`)
        .send(dto)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app.getHttpServer())
        .delete(`/api/reviews/${body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    test('retun status code 404 if review not found', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/reviews/100`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test('retun status code 400 if review id is invalid', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/reviews/abc`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(400);
    });

    test('retun status code 401 if token is not provide', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/api/reviews/${productId}`)
        .send(dto)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app.getHttpServer()).delete(
        `/api/reviews/${body.id}`,
      );
      expect(response.status).toBe(401);
    });
  });
});
