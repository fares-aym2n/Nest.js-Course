import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { registerTDO } from './register.dto';
import { loginTDO } from './login.dto';
import { forgotPasswordDTO } from './forgot-password.dto';
import { resetPasswordDTO } from './reset-password.dto';
import { updateTDO } from './update.dto';
import { uploadImageDTO } from './upload-image.dto';

describe('Users DTOs', () => {
  describe('registerTDO', () => {
    it('should pass validation with valid register data', async () => {
      const dto = plainToInstance(registerTDO, {
        username: 'validuser',
        email: 'user@example.com',
        password: 'password123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid email', async () => {
      const dto = plainToInstance(registerTDO, {
        username: 'validuser',
        email: 'not-an-email',
        password: 'password123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('should fail validation when password is too short', async () => {
      const dto = plainToInstance(registerTDO, {
        email: 'user@example.com',
        password: '12',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });
  });

  describe('loginTDO', () => {
    it('should pass validation with valid login data', async () => {
      const dto = plainToInstance(loginTDO, {
        email: 'user@example.com',
        password: 'password123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid email', async () => {
      const dto = plainToInstance(loginTDO, {
        email: 'bad-email',
        password: 'password123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });
  });

  describe('forgotPasswordDTO', () => {
    it('should pass validation with valid email', async () => {
      const dto = plainToInstance(forgotPasswordDTO, {
        email: 'valid@example.com',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with empty email', async () => {
      const dto = plainToInstance(forgotPasswordDTO, {
        email: '',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('resetPasswordDTO', () => {
    it('should pass validation with valid reset data', async () => {
      const dto = plainToInstance(resetPasswordDTO, {
        userId: 1,
        resetPasswordToken: 'token-abc',
        newPassword: 'new-password-123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation if userId is missing', async () => {
      const dto = plainToInstance(resetPasswordDTO, {
        resetPasswordToken: 'token-abc',
        newPassword: 'new-password-123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'userId')).toBe(true);
    });
  });

  describe('updateTDO', () => {
    it('should pass validation with empty object (all optional)', async () => {
      const dto = plainToInstance(updateTDO, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with valid username and password', async () => {
      const dto = plainToInstance(updateTDO, {
        username: 'new_username',
        password: 'new_password123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('uploadImageDTO', () => {
    it('should instantiate uploadImageDTO', () => {
      const dto = new uploadImageDTO();
      dto.file = { filename: 'avatar.jpg' } as any;
      expect(dto.file.filename).toBe('avatar.jpg');
    });
  });
});
