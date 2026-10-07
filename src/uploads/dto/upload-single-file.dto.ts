import type { Express } from 'express';
import { ApiProperty } from '@nestjs/swagger';
export class uploadSingleFileDTO {
  @ApiProperty({
    type: 'file',
    name: 'file',
    required: true,
    description: 'upload single file',
  })
  file: Express.Multer.File;
}
