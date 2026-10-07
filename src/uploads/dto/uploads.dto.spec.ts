import { uploadSingleFileDTO } from './upload-single-file.dto';
import { uploadMultiFileDTO } from './upload-multi-file.dto';

describe('Uploads DTOs', () => {
  it('should instantiate uploadSingleFileDTO', () => {
    const dto = new uploadSingleFileDTO();
    dto.file = { filename: 'file.jpg' } as any;
    expect(dto.file.filename).toBe('file.jpg');
  });

  it('should instantiate uploadMultiFileDTO', () => {
    const dto = new uploadMultiFileDTO();
    dto.files = [{ filename: 'file1.jpg' } as any, { filename: 'file2.jpg' } as any];
    expect(dto.files.length).toBe(2);
  });
});
