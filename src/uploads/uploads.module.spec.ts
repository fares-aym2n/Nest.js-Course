import { Test } from '@nestjs/testing';
import { UploadsModule } from './uploads.module';
import { uploadsController } from './uploads.controller';
import { BadRequestException } from '@nestjs/common';

describe('UploadsModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [UploadsModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get<uploadsController>(uploadsController)).toBeDefined();
  });

  it('should have properly configured multer options (storage, fileFilter, and limits)', () => {
    const imports: any[] = Reflect.getMetadata('imports', UploadsModule) || [];
    expect(imports.length).toBeGreaterThan(0);

    const multerDynamicModule = imports.find(
      (item) => item && item.providers,
    );
    expect(multerDynamicModule).toBeDefined();

    const optionsProvider = multerDynamicModule.providers?.find(
      (p: any) => p && p.provide === 'MULTER_MODULE_OPTIONS',
    );
    expect(optionsProvider).toBeDefined();

    const multerOptions =
      typeof optionsProvider.useFactory === 'function'
        ? optionsProvider.useFactory()
        : optionsProvider.useValue;

    expect(multerOptions).toBeDefined();
    expect(multerOptions.limits).toEqual({ fileSize: 2 * 1024 * 1024 });

    // Test storage filename callback
    const filenameCb = jest.fn();
    multerOptions.storage.getFilename(
      {} as any,
      { originalname: 'avatar.png' } as any,
      filenameCb,
    );
    expect(filenameCb).toHaveBeenCalledWith(
      null,
      expect.stringMatching(/^\d+-\d+-avatar\.png$/),
    );

    // Test fileFilter with image mimetype
    const cb = jest.fn();
    multerOptions.fileFilter(
      {} as any,
      { mimetype: 'image/png' } as any,
      cb,
    );
    expect(cb).toHaveBeenCalledWith(null, true);

    // Test fileFilter with non-image mimetype
    const cbError = jest.fn();
    multerOptions.fileFilter(
      {} as any,
      { mimetype: 'application/pdf' } as any,
      cbError,
    );
    expect(cbError).toHaveBeenCalledWith(
      expect.any(BadRequestException),
      false,
    );
  });
});
