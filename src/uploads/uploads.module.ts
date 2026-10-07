import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { uploadsController } from './uploads.controller';
import { diskStorage } from 'multer';

@Module({
  controllers: [uploadsController],
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './images',
        filename(req, file, cb) {
          const filename = `${Date.now()}-${Math.round(Math.random() * 10000)}-${file.originalname}`;
          return cb(null, filename);
        },
      }),
      fileFilter(req, file, cb) {
        if (file.mimetype.startsWith('image')) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Please Provide image file only',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
    }),
  ],
})
export class UploadsModule {}
