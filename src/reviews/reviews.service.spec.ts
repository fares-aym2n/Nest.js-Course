import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewService } from './reviews.service';
import { Review } from './reviews.entity';
import { UserService } from '../users/users.service';
import { ProductService } from '../products/products.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { createReviewDTO } from './dto/create-reviews.dto';
import { updateReviewDTO } from './dto/upate-review.dto';
import { UserTypes } from '../utils/user-types';
import { payloadTypes } from '../utils/payload';

describe('ReviewService', () => {
  let reviewService: ReviewService;
  let reviewRepository: Repository<Review>;
  let userService: UserService;
  let productService: ProductService;

  const REPOSITORY_TOKEN = getRepositoryToken(Review);

  const mockUser = {
    id: 1,
    username: 'john_doe',
    email: 'john@example.com',
    role: UserTypes.USER,
  };

  const mockProduct = {
    id: 10,
    name: 'Awesome Book',
    description: 'A great read',
    price: 25,
  };

  const mockReview: Review = {
    id: 1,
    review: 'Great product!',
    rating: 5,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    user: mockUser as any,
    product: mockProduct as any,
  };

  const mockReviewRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserService = {
    getCurrentUser: jest.fn(),
  };

  const mockProductService = {
    getOneBy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: REPOSITORY_TOKEN, useValue: mockReviewRepository },
        { provide: UserService, useValue: mockUserService },
        { provide: ProductService, useValue: mockProductService },
      ],
    }).compile();

    reviewService = module.get<ReviewService>(ReviewService);
    reviewRepository = module.get<Repository<Review>>(REPOSITORY_TOKEN);
    userService = module.get<UserService>(UserService);
    productService = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(reviewService).toBeDefined();
    expect(reviewRepository).toBeDefined();
    expect(userService).toBeDefined();
    expect(productService).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all reviews ordered by createdAt DESC with total result count', async () => {
      const reviewsList = [mockReview];
      mockReviewRepository.find.mockResolvedValue(reviewsList);

      const result = await reviewService.getAll();

      expect(mockReviewRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({
        result: 1,
        reviews: reviewsList,
      });
    });

    it('should return 0 result when no reviews exist', async () => {
      mockReviewRepository.find.mockResolvedValue([]);

      const result = await reviewService.getAll();

      expect(result).toEqual({
        result: 0,
        reviews: [],
      });
    });
  });

  describe('getOne', () => {
    it('should return a review when it exists', async () => {
      mockReviewRepository.findOne.mockResolvedValue(mockReview);

      const result = await reviewService.getOne(1);

      expect(mockReviewRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { user: true },
      });
      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException when review does not exist', async () => {
      mockReviewRepository.findOne.mockResolvedValue(null);

      await expect(reviewService.getOne(999)).rejects.toThrow(
        new NotFoundException('Review is not found'),
      );
      expect(mockReviewRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: { user: true },
      });
    });
  });

  describe('createReview', () => {
    const dto: createReviewDTO = {
      review: 'Incredible book',
      rating: 4.8,
    };

    it('should successfully create and save a review and return formatted response', async () => {
      mockUserService.getCurrentUser.mockResolvedValue(mockUser);
      mockProductService.getOneBy.mockResolvedValue(mockProduct);

      const createdReviewEntity = {
        ...dto,
        user: mockUser,
        product: mockProduct,
        createdAt: new Date('2026-01-02'),
        updatedAt: new Date('2026-01-02'),
      };

      mockReviewRepository.create.mockReturnValue(createdReviewEntity);
      mockReviewRepository.save.mockResolvedValue(createdReviewEntity);

      const result = await reviewService.createReview(dto, 1, 10);

      expect(mockUserService.getCurrentUser).toHaveBeenCalledWith(1);
      expect(mockProductService.getOneBy).toHaveBeenCalledWith(10);
      expect(mockReviewRepository.create).toHaveBeenCalledWith({
        ...dto,
        user: mockUser,
        product: mockProduct,
      });
      expect(mockReviewRepository.save).toHaveBeenCalledWith(
        createdReviewEntity,
      );
      expect(result).toEqual({
        review: dto.review,
        rating: dto.rating,
        userId: mockUser.id,
        productId: mockProduct.id,
        createdAt: createdReviewEntity.createdAt,
        updatedAt: createdReviewEntity.updatedAt,
      });
    });

    it('should propagate NotFoundException if user is not found', async () => {
      mockUserService.getCurrentUser.mockRejectedValue(
        new NotFoundException('User is not found'),
      );

      await expect(reviewService.createReview(dto, 999, 10)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockProductService.getOneBy).not.toHaveBeenCalled();
      expect(mockReviewRepository.create).not.toHaveBeenCalled();
    });

    it('should propagate NotFoundException if product is not found', async () => {
      mockUserService.getCurrentUser.mockResolvedValue(mockUser);
      mockProductService.getOneBy.mockRejectedValue(
        new NotFoundException('Product is not found'),
      );

      await expect(reviewService.createReview(dto, 1, 999)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockReviewRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update both review text and rating when both are provided', async () => {
      const existingReview = {
        id: 1,
        review: 'Old review',
        rating: 3,
        user: { id: 1 },
      };
      mockReviewRepository.findOne.mockResolvedValue(existingReview);
      mockReviewRepository.save.mockImplementation((r) => Promise.resolve(r));

      const dto: updateReviewDTO = {
        review: 'New updated review',
        rating: 5,
      };

      const result = await reviewService.update(1, 1, dto);

      expect(mockReviewRepository.save).toHaveBeenCalledWith({
        id: 1,
        review: 'New updated review',
        rating: 5,
        user: { id: 1 },
      });
      expect(result.review).toBe('New updated review');
      expect(result.rating).toBe(5);
    });

    it('should keep existing review text when dto.review is undefined', async () => {
      const existingReview = {
        id: 1,
        review: 'Old review',
        rating: 3,
        user: { id: 1 },
      };
      mockReviewRepository.findOne.mockResolvedValue(existingReview);
      mockReviewRepository.save.mockImplementation((r) => Promise.resolve(r));

      const dto: updateReviewDTO = {
        rating: 4.5,
      };

      const result = await reviewService.update(1, 1, dto);

      expect(result.review).toBe('Old review');
      expect(result.rating).toBe(4.5);
    });

    it('should keep existing rating when dto.rating is undefined', async () => {
      const existingReview = {
        id: 1,
        review: 'Old review',
        rating: 3,
        user: { id: 1 },
      };
      mockReviewRepository.findOne.mockResolvedValue(existingReview);
      mockReviewRepository.save.mockImplementation((r) => Promise.resolve(r));

      const dto: updateReviewDTO = {
        review: 'Changed text only',
      };

      const result = await reviewService.update(1, 1, dto);

      expect(result.review).toBe('Changed text only');
      expect(result.rating).toBe(3);
    });

    it('should throw ForbiddenException if current user is not the review creator', async () => {
      const existingReview = {
        id: 1,
        review: 'Old review',
        rating: 3,
        user: { id: 2 }, // Different user
      };
      mockReviewRepository.findOne.mockResolvedValue(existingReview);

      const dto: updateReviewDTO = {
        review: 'Hacker update',
      };

      await expect(reviewService.update(1, 1, dto)).rejects.toThrow(
        new ForbiddenException('You are not allawed to update review'),
      );
      expect(mockReviewRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if review does not exist', async () => {
      mockReviewRepository.findOne.mockResolvedValue(null);

      await expect(
        reviewService.update(999, 1, { review: 'text' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should allow the owner to delete their review', async () => {
      const existingReview = {
        id: 1,
        review: 'Old review',
        rating: 3,
        user: { id: 1 },
      };
      mockReviewRepository.findOne.mockResolvedValue(existingReview);
      mockReviewRepository.remove.mockResolvedValue(existingReview);

      const payload: payloadTypes = {
        id: 1,
        role: UserTypes.USER,
      };

      const result = await reviewService.delete(1, payload);

      expect(mockReviewRepository.remove).toHaveBeenCalledWith(existingReview);
      expect(result).toBe('Review deleted successfuly');
    });

    it('should allow an admin to delete any user review', async () => {
      const existingReview = {
        id: 1,
        review: 'User review',
        rating: 2,
        user: { id: 5 }, // Different user
      };
      mockReviewRepository.findOne.mockResolvedValue(existingReview);
      mockReviewRepository.remove.mockResolvedValue(existingReview);

      const adminPayload: payloadTypes = {
        id: 99,
        role: UserTypes.ADMIN,
      };

      const result = await reviewService.delete(1, adminPayload);

      expect(mockReviewRepository.remove).toHaveBeenCalledWith(existingReview);
      expect(result).toBe('Review deleted successfuly');
    });

    it('should throw ForbiddenException if user is not the owner and not an admin', async () => {
      const existingReview = {
        id: 1,
        review: 'User review',
        rating: 2,
        user: { id: 5 },
      };
      mockReviewRepository.findOne.mockResolvedValue(existingReview);

      const regularUserPayload: payloadTypes = {
        id: 10,
        role: UserTypes.USER,
      };

      await expect(
        reviewService.delete(1, regularUserPayload),
      ).rejects.toThrow(
        new ForbiddenException('You are not allawed to update review'),
      );
      expect(mockReviewRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if review does not exist', async () => {
      mockReviewRepository.findOne.mockResolvedValue(null);

      const payload: payloadTypes = {
        id: 1,
        role: UserTypes.USER,
      };

      await expect(reviewService.delete(999, payload)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
