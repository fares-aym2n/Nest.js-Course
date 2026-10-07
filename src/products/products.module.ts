import { Module } from '@nestjs/common';
import { ProductController } from './products.controller';
import { ProductService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './products.entity';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../users/users.module';

@Module({
  controllers: [ProductController],
  providers: [ProductService],

  imports: [
    TypeOrmModule.forFeature([Product]),
    UserModule,
    JwtModule,
  ],
  exports:[ProductService]
})
export class ProductModule {}
