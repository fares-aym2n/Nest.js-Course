import { Module } from '@nestjs/common';
import { ReviewController } from './reviews.controller';
import { ReviewService } from './reviews.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './reviews.entity';
import { UserModule } from '../users/users.module';
import { ProductModule } from '../products/products.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService],
  imports: [
    TypeOrmModule.forFeature([Review]),
    UserModule,
    ProductModule,
    JwtModule,
  ],
})
export class ReviewModule {}
