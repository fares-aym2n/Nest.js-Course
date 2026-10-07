import { Test, TestingModule } from '@nestjs/testing';
import { uploadsController } from './uploads.controller';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';

describe('UploadsController', () => {
  let controller: uploadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [uploadsController],
    }).compile();

    controller = module.get<uploadsController>(uploadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should successfully upload a single file', () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        filename: 'test-12345.jpg',
      } as Express.Multer.File;

      const result = controller.uploadFile(mockFile);

      expect(result).toBe('File uploaded successfuly');
    });

    it('should throw BadRequestException if file is undefined', () => {
      expect(() => controller.uploadFile(undefined as any)).toThrow(
        new BadRequestException('The file is not provided'),
      );
    });

    it('should throw BadRequestException if file is null', () => {
      expect(() => controller.uploadFile(null as any)).toThrow(
        new BadRequestException('The file is not provided'),
      );
    });
  });

  describe('uploadMultipleFile', () => {
    it('should successfully upload multiple files', () => {
      const mockFiles = [
        {
          fieldname: 'files',
          originalname: 'test1.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          filename: 'test1-12345.jpg',
        },
        {
          fieldname: 'files',
          originalname: 'test2.jpg',
          mimetype: 'image/png',
          size: 2048,
          filename: 'test2-67890.png',
        },
      ] as Array<Express.Multer.File>;

      const result = controller.uploadMultipleFile(mockFiles);

      expect(result).toBe('Files uploaded successfuly');
    });

    it('should throw BadRequestException if files array is empty', () => {
      expect(() => controller.uploadMultipleFile([])).toThrow(
        new BadRequestException('The files is not provided'),
      );
    });

    it('should throw BadRequestException if files is undefined', () => {
      expect(() => controller.uploadMultipleFile(undefined as any)).toThrow(
        new BadRequestException('The files is not provided'),
      );
    });

    it('should throw BadRequestException if files is null', () => {
      expect(() => controller.uploadMultipleFile(null as any)).toThrow(
        new BadRequestException('The files is not provided'),
      );
    });
  });

  describe('getImage', () => {
    it('should send file with image path and root folder options', () => {
      const mockRes = {
        sendFile: jest.fn(),
      } as unknown as Response;

      controller.getImage('sample-image.jpg', mockRes);

      expect(mockRes.sendFile).toHaveBeenCalledWith('sample-image.jpg', {
        root: 'images',
      });
      expect(mockRes.sendFile).toHaveBeenCalledTimes(1);
    });
  });
});
