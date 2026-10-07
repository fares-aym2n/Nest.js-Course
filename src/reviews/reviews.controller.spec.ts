import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './reviews.controller';
import { ReviewService } from './reviews.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/users.service';
import { Reflector } from '@nestjs/core';
import { createReviewDTO } from './dto/create-reviews.dto';
import { updateReviewDTO } from './dto/upate-review.dto';
import { payloadTypes } from '../utils/payload';
import { UserTypes } from '../utils/user-types';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ReviewController', () => {
  let reviewController: ReviewController;
  let reviewService: ReviewService;

  const mockReview = {
    id: 1,
    review: 'Great product!',
    rating: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 1, username: 'testuser' },
    product: { id: 10, name: 'Sample Product' },
  };

  const currentUser: payloadTypes = {
    id: 1,
    role: UserTypes.USER,
  };

  const adminUser: payloadTypes = {
    id: 99,
    role: UserTypes.ADMIN,
  };

  const mockReviewService = {
    getAll: jest.fn(),
    getOne: jest.fn(),
    createReview: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [
        { provide: ReviewService, useValue: mockReviewService },
        { provide: ConfigService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: Reflector, useValue: {} },
      ],
    }).compile();

    reviewController = module.get<ReviewController>(ReviewController);
    reviewService = module.get<ReviewService>(ReviewService);
  });

  it('should be defined', () => {
    expect(reviewController).toBeDefined();
    expect(reviewService).toBeDefined();
  });

  describe('getAllReviews', () => {
    it('should call reviewService.getAll and return all reviews with count', async () => {
      const result = { result: 1, reviews: [mockReview as any] };
      mockReviewService.getAll.mockResolvedValue(result);

      const response = await reviewController.getAllReviews();

      expect(mockReviewService.getAll).toHaveBeenCalledTimes(1);
      expect(response).toEqual(result);
    });

    it('should propagate service errors', async () => {
      mockReviewService.getAll.mockRejectedValue(new Error('Database error'));

      await expect(reviewController.getAllReviews()).rejects.toThrow('Database error');
    });
  });

  describe('getReview', () => {
    it('should call reviewService.getOne with id and return the review', async () => {
      mockReviewService.getOne.mockResolvedValue(mockReview);

      const response = await reviewController.getReview(1);

      expect(mockReviewService.getOne).toHaveBeenCalledWith(1);
      expect(mockReviewService.getOne).toHaveBeenCalledTimes(1);
      expect(response).toEqual(mockReview);
    });

    it('should propagate NotFoundException when review does not exist', async () => {
      mockReviewService.getOne.mockRejectedValue(
        new NotFoundException('Review is not found'),
      );

      await expect(reviewController.getReview(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockReviewService.getOne).toHaveBeenCalledWith(999);
    });
  });

  describe('createReview', () => {
    const dto: createReviewDTO = {
      review: 'Excellent!',
      rating: 4.5,
    };

    it('should call reviewService.createReview with dto, userId, and productId', async () => {
      const createdResult = {
        review: dto.review,
        rating: dto.rating,
        userId: currentUser.id,
        productId: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReviewService.createReview.mockResolvedValue(createdResult);

      const response = await reviewController.createReview(
        dto,
        currentUser,
        10,
      );

      expect(mockReviewService.createReview).toHaveBeenCalledWith(
        dto,
        currentUser.id,
        10,
      );
      expect(mockReviewService.createReview).toHaveBeenCalledTimes(1);
      expect(response).toEqual(createdResult);
    });

    it('should propagate error if product is not found', async () => {
      mockReviewService.createReview.mockRejectedValue(
        new NotFoundException('Product is not found'),
      );

      await expect(
        reviewController.createReview(dto, currentUser, 999),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateReview', () => {
    const dto: updateReviewDTO = {
      review: 'Updated review text',
      rating: 4,
    };

    it('should call reviewService.update with reviewId, userId, and dto', async () => {
      const updatedReview = { ...mockReview, ...dto };
      mockReviewService.update.mockResolvedValue(updatedReview);

      const response = await reviewController.updateReview(
        1,
        currentUser,
        dto,
      );

      expect(mockReviewService.update).toHaveBeenCalledWith(
        1,
        currentUser.id,
        dto,
      );
      expect(mockReviewService.update).toHaveBeenCalledTimes(1);
      expect(response).toEqual(updatedReview);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockReviewService.update.mockRejectedValue(
        new ForbiddenException('You are not allawed to update review'),
      );

      await expect(
        reviewController.updateReview(1, currentUser, dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteReview', () => {
    it('should call reviewService.delete with reviewId and payload', async () => {
      mockReviewService.delete.mockResolvedValue(
        'Review deleted successfuly',
      );

      const response = await reviewController.deleteReview(
        1,
        currentUser,
      );

      expect(mockReviewService.delete).toHaveBeenCalledWith(
        1,
        currentUser,
      );
      expect(mockReviewService.delete).toHaveBeenCalledTimes(1);
      expect(response).toBe('Review deleted successfuly');
    });

    it('should allow admin to delete review', async () => {
      mockReviewService.delete.mockResolvedValue(
        'Review deleted successfuly',
      );

      const response = await reviewController.deleteReview(1, adminUser);

      expect(mockReviewService.delete).toHaveBeenCalledWith(1, adminUser);
      expect(response).toBe('Review deleted successfuly');
    });

    it('should propagate ForbiddenException if user is not owner and not admin', async () => {
      mockReviewService.delete.mockRejectedValue(
        new ForbiddenException('You are not allawed to update review'),
      );

      await expect(
        reviewController.deleteReview(1, currentUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
