import {
  ClassSerializerInterceptor,
  Module,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ProductModule } from './products/products.module';
import { UserModule } from './users/users.module';
import { ReviewModule } from './reviews/reviews.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './products/products.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Review } from './reviews/reviews.entity';
import { User } from './users/users.entity';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { UploadsModule } from './uploads/uploads.module';
import { MailModule } from './mails/mail.module';
import { NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './utils/middlewares/logger.middleware';
import { createObserveModule } from '@nestjs/observe';
import {
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';
import { AuthGuard } from './users/guards/auth.guard';

export const { ObserveModule, ObserveInstrument } =
  createObserveModule();

@Module({
  imports: [
    ProductModule,
    UserModule,
    ReviewModule,
    UploadsModule,
    MailModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'postgres',
          database: config.get<string>('DB_NAME'),
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD'),
          synchronize: process.env.NODE_ENV !== 'production',
          entities: [Product, Review, User],
        };
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10000,
          limit: 10,
        },
      ],
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide:APP_PIPE,
      useValue:new ValidationPipe({whitelist:true,forbidNonWhitelisted:true})
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(LoggerMiddleware).forRoutes({
    //   path: '*',
    // });
  }
}
