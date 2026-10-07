import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { uploadMultiFileDTO } from './dto/upload-multi-file.dto';
import { uploadSingleFileDTO } from './dto/upload-single-file.dto';

@Controller('/api/uploads')
export class uploadsController {
  @Post('single-file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({ type: uploadSingleFileDTO })
  @ApiConsumes('multipart/form-data')
  public uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('The file is not provided');
    }
    return 'File uploaded successfuly';
  }
  @Post('multiple-file')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiBody({ type: uploadMultiFileDTO })
  @ApiConsumes('multipart/form-data')
  public uploadMultipleFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    if (!files || files.length == 0) {
      throw new BadRequestException('The files is not provided');
    }
    return 'Files uploaded successfuly';
  }

  @Get(':image')
  @ApiParam({
    type: 'string',
    name: 'image',
    required: true,
    description: 'Retrieve an image by its image path',
  })
  public getImage(
    @Param('image') image: string,
    @Res() res: Response,
  ) {
    return res.sendFile(image, { root: 'images' });
  }
}
