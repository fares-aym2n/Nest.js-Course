import { ApiProperty } from '@nestjs/swagger';
export class uploadMultiFileDTO {
  @ApiProperty({
    type: 'array',
    name: 'files',
    required: true,
    description: 'upload multiple file',
    items: { type: 'file' },
  })
  files: Array<Express.Multer.File>;
}
