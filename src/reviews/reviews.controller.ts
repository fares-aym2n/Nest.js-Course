import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ReviewService } from './reviews.service';
import { CurrentUser } from '../users/decorators/auth.decorator';
import { createReviewDTO } from './dto/create-reviews.dto';
import type { payloadTypes } from '../utils/payload';
import { AuthRolesGuard } from '../users/guards/auth-role.guard';
import { Roles } from '../users/decorators/user-roles.decorator';
import { UserTypes } from '../utils/user-types';
import { updateReviewDTO } from './dto/upate-review.dto';
import {
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

@Controller('/api/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // GET: ~/api/reviews
  @Get()
  public getAllReviews() {
    return this.reviewService.getAll();
  }

  // GET: ~/api/reviews/:id
  @Get('/:id')
  public getReview(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.getOne(id);
  }

  // POST: ~/api/reviews/:id
  @Post('/:id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserTypes.USER, UserTypes.ADMIN)
  @ApiSecurity('bearer')
  @ApiParam({
    name: 'id',
    required: true,
    description:
      'Add a review for a specific product by product id',
  })
  public createReview(
    @Body() dto: createReviewDTO,
    @CurrentUser() payload: payloadTypes,
    @Param('id', ParseIntPipe) productId: number,
  ) {
    return this.reviewService.createReview(
      dto,
      payload.id,
      productId,
    );
  }

  // PATCH: ~/api/reviews/:id
  @Patch('/:id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserTypes.USER, UserTypes.ADMIN)
  @ApiSecurity('bearer')
  public updateReview(
    @Param('id', ParseIntPipe) reviewId: number,
    @CurrentUser() payload: payloadTypes,
    @Body() dto: updateReviewDTO,
  ) {
    return this.reviewService.update(reviewId, payload.id, dto);
  }

  // DELETE: ~/api/reviews/:id
  @HttpCode(204)
  @Delete('/:id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserTypes.ADMIN, UserTypes.USER)
  @ApiSecurity('bearer')
  public deleteReview(
    @Param('id', ParseIntPipe) reviewId: number,
    @CurrentUser() payload: payloadTypes,
  ) {
    return this.reviewService.delete(reviewId, payload);
  }
}
