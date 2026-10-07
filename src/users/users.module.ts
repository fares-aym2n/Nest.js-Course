import { BadRequestException, Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AuthService } from './auth.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MailModule } from '../mails/mail.module';

@Module({
  controllers: [UserController],
  providers: [UserService, AuthService],
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          global: true,
          secret: config.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: config.get<StringValue>('JWT_EXPIRED'),
          },
        };
      },
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: './images/users',
        filename(req, file, cb) {
          const filename = `${Date.now() - Math.round(Math.random() * 100000)}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      fileFilter(req, file, cb) {
        if (!file.mimetype.startsWith('image')) {
          throw new BadRequestException(
            'The image file is only allawed',
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 1024 * 1024 * 3 },
    }),
    MailModule,
  ],
  exports: [UserService],
})
export class UserModule {}
