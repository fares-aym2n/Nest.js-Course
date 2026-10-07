import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from './users.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mails/mail.service';
import { BadRequestException } from '@nestjs/common';
import { UserTypes } from '../utils/user-types';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockImplementation((pass: string) => Promise.resolve(`hashed_${pass}`)),
  compare: jest.fn(),
}));

describe('User Service', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let REPOSITORY_TOKEN = getRepositoryToken(User);
  let mailService: MailService;
  let configService: ConfigService;
  let jwtService: JwtService;

  type createUserTDO = {
    username: 'fares';
    email: 'test@gmail.com';
    password: 'test1234';
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule(
      {
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'BASE_URL') return 'http://localhost:3000';
                if (key === 'CLIENT_URL') return 'http://localhost:3001';
                return null;
              }),
            },
          },
          {
            provide: JwtService,
            useValue: {
              signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
            },
          },
          {
            provide: MailService,
            useValue: {
              sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
              sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
            },
          },
          {
            provide: REPOSITORY_TOKEN,
            useValue: {
              findOne: jest.fn(),
              create: jest.fn((dto: createUserTDO) =>
                Promise.resolve(dto),
              ),
              save: jest.fn((user: User) =>
                Promise.resolve(user),
              ),
            },
          },
        ],
      },
    ).compile();
    authService = module.get<AuthService>(AuthService);
    userRepository =
      module.get<Repository<User>>(REPOSITORY_TOKEN);
    mailService = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
  });
  test("should 'authService' to be defined", async () => {
    expect(authService).toBeDefined();
  });
  test("should 'userRepository' to be defined", async () => {
    expect(userRepository).toBeDefined();
  });
  describe('Register method', () => {
    test("should call 'findOne' method", async () => {
      await authService.register({
        username: 'test',
        email: 'test@gmail.com',
        password: 'test1234',
      });
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
    });

    test("should call 'create' method", async () => {
      await authService.register({
        username: 'test',
        email: 'test@gmail.com',
        password: 'test1234',
      });
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.create).toHaveBeenCalledTimes(1);
    });

    test("should call 'save' method", async () => {
      await authService.register({
        username: 'test',
        email: 'test@gmail.com',
        password: 'test1234',
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });
    test("should call 'sendVerificationEmail' method", async () => {
      await authService.register({
        username: 'test',
        email: 'test@gmail.com',
        password: 'test1234',
      });
      expect(
        mailService.sendVerificationEmail,
      ).toHaveBeenCalled();
      expect(
        mailService.sendVerificationEmail,
      ).toHaveBeenCalledTimes(1);
    });
    test("should call 'get verificationEmail' method", async () => {
      await authService.register({
        username: 'test',
        email: 'test@gmail.com',
        password: 'test1234',
      });
      expect(configService.get).toHaveBeenCalled();
      expect(configService.get).toHaveBeenCalledTimes(1);
    });

    test('should throw BadRequestException if user already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 1,
        email: 'test@gmail.com',
      } as User);

      await expect(
        authService.register({
          username: 'test',
          email: 'test@gmail.com',
          password: 'test1234',
        }),
      ).rejects.toThrow(new BadRequestException('user is already exist'));
    });
  });

  describe('Login method', () => {
    test('should throw BadRequestException if user is not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'notfound@gmail.com',
          password: 'testpassword',
        }),
      ).rejects.toThrow(
        new BadRequestException('Incorrect in email or password'),
      );
    });

    test('should throw BadRequestException if password is incorrect', async () => {
      const mockUser = {
        id: 1,
        email: 'test@gmail.com',
        password: 'hashed-password',
      } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@gmail.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(new BadRequestException('Incorrect in password'));
    });

    test('should resend verification email if email is not validated and verification token exists', async () => {
      const mockUser = {
        id: 1,
        email: 'test@gmail.com',
        password: 'hashed-password',
        isEmailValidation: false,
        verificationToken: 'existing-verify-token',
      } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@gmail.com',
        password: 'test1234',
      });

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser,
        expect.stringContaining('existing-verify-token'),
      );
      expect(result).toEqual({
        message:
          'Verification emali is send .Please verify your email and login.',
      });
    });

    test('should generate new verification token and save user if email is not validated and has no token', async () => {
      const mockUser = {
        id: 1,
        email: 'test@gmail.com',
        password: 'hashed-password',
        isEmailValidation: false,
        verificationToken: null,
      } as unknown as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(userRepository, 'save').mockImplementation((u) => Promise.resolve(u));

      const result = await authService.login({
        email: 'test@gmail.com',
        password: 'test1234',
      });

      expect(userRepository.save).toHaveBeenCalled();
      expect(mockUser.verificationToken).toBeTruthy();
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result).toEqual({
        message:
          'Verification emali is send .Please verify your email and login.',
      });
    });

    test('should return JWT token when user credentials and email validation are valid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@gmail.com',
        password: 'hashed-password',
        role: UserTypes.USER,
        isEmailValidation: true,
      } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@gmail.com',
        password: 'test1234',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        id: 1,
        role: UserTypes.USER,
      });
      expect(result).toEqual({ token: 'mock-jwt-token' });
    });
  });

  describe('sendResetPasswordLink', () => {
    test('should throw BadRequestException if user with given email does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        authService.sendResetPasswordLink({ email: 'notfound@gmail.com' }),
      ).rejects.toThrow(
        new BadRequestException('User with given email is not exist.'),
      );
    });

    test('should generate reset token, save user, and send reset password email', async () => {
      const mockUser = {
        id: 1,
        email: 'test@gmail.com',
        resetPasswordToken: null,
      } as unknown as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockImplementation((u) => Promise.resolve(u));

      const result = await authService.sendResetPasswordLink({
        email: 'test@gmail.com',
      });

      expect(mockUser.resetPasswordToken).toBeTruthy();
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        mockUser,
        expect.stringContaining('reset-password/1/'),
      );
      expect(result).toEqual({
        message:
          'Password reset link send to email , check your inbox.',
      });
    });
  });

  describe('getResetPasswordLink', () => {
    test('should throw BadRequestException if user does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        authService.getResetPasswordLink(1, 'any-token'),
      ).rejects.toThrow(new BadRequestException('Reset password is invalid'));
    });

    test('should throw BadRequestException if user resetPasswordToken is null', async () => {
      const mockUser = {
        id: 1,
        resetPasswordToken: null,
      } as unknown as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(
        authService.getResetPasswordLink(1, 'some-token'),
      ).rejects.toThrow(
        new BadRequestException('reset password token is invalid'),
      );
    });

    test('should throw BadRequestException if resetPasswordToken does not match', async () => {
      const mockUser = {
        id: 1,
        resetPasswordToken: 'correct-token',
      } as unknown as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(
        authService.getResetPasswordLink(1, 'wrong-token'),
      ).rejects.toThrow(
        new BadRequestException('reset password token is invalid'),
      );
    });

    test('should return success message if resetPasswordToken matches', async () => {
      const mockUser = {
        id: 1,
        resetPasswordToken: 'correct-token',
      } as unknown as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await authService.getResetPasswordLink(1, 'correct-token');

      expect(result).toEqual({ message: 'Valid reset password token ' });
    });
  });

  describe('resetPassword', () => {
    test('should throw BadRequestException if user is not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        authService.resetPassword({
          userId: 1,
          resetPasswordToken: 'token',
          newPassword: 'newpass',
        }),
      ).rejects.toThrow(new BadRequestException('Reset password is invalid'));
    });

    test('should throw BadRequestException if resetPasswordToken does not match', async () => {
      const mockUser = {
        id: 1,
        resetPasswordToken: 'token123',
      } as unknown as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(
        authService.resetPassword({
          userId: 1,
          resetPasswordToken: 'wrong-token',
          newPassword: 'newpass',
        }),
      ).rejects.toThrow(new BadRequestException('Reset password is invalid'));
    });

    test('should throw BadRequestException if user resetPasswordToken is null', async () => {
      const mockUser = {
        id: 1,
        resetPasswordToken: null,
      } as unknown as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(
        authService.resetPassword({
          userId: 1,
          resetPasswordToken: 'token123',
          newPassword: 'newpass',
        }),
      ).rejects.toThrow(new BadRequestException('Reset password is invalid'));
    });

    test('should successfully hash new password, reset token, save user, and return message', async () => {
      const mockUser = {
        id: 1,
        resetPasswordToken: 'valid-token',
        password: 'old-hashed-password',
      } as unknown as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newly-hashed-pass');
      jest.spyOn(userRepository, 'save').mockImplementation((u) => Promise.resolve(u));

      const result = await authService.resetPassword({
        userId: 1,
        resetPasswordToken: 'valid-token',
        newPassword: 'newpass123',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 12);
      expect(mockUser.password).toBe('newly-hashed-pass');
      expect(mockUser.resetPasswordToken).toBeNull();
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ message: 'Password reset successfuly' });
    });
  });

  describe('hashePassword', () => {
    test('should call bcrypt.hash with password and salt rounds 10', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-val');

      const result = await authService.hashePassword('plainTextPass');

      expect(bcrypt.hash).toHaveBeenCalledWith('plainTextPass', 10);
      expect(result).toBe('hashed-val');
    });
  });
});
