import type { Express } from 'express';
import { ApiProperty } from '@nestjs/swagger';

export class uploadImageDTO {
  @ApiProperty({
    type: 'file',
    name: 'profile_image',
    description: 'upload profile image',
    required: true,
  })
  file: Express.Multer.File;
}
