import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './users.service';
import { AuthService } from './auth.service';
import { User } from './users.entity';
import { UserTypes } from '../utils/user-types';
import { payloadTypes } from '../utils/payload';
import { registerTDO } from './dto/register.dto';
import { loginTDO } from './dto/login.dto';
import { updateTDO } from './dto/update.dto';
import { forgotPasswordDTO } from './dto/forgot-password.dto';
import { resetPasswordDTO } from './dto/reset-password.dto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import path from 'path';

jest.mock('fs', () => ({
  unlinkSync: jest.fn(),
}));

describe('UserService', () => {
  let userService: UserService;
  let userRepository: Repository<User>;
  let authService: AuthService;

  const REPOSITORY_TOKEN = getRepositoryToken(User);

  const createMockUser = (overrides?: Partial<User>): User => {
    return {
      id: 1,
      username: 'john_doe',
      email: 'john@example.com',
      password: 'hashed_password_123',
      role: UserTypes.USER,
      isEmailValidation: false,
      profile_image: null,
      verificationToken: 'valid-verify-token',
      resetPasswordToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      products: [],
      reviews: [],
      ...overrides,
    };
  };

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    hashePassword: jest.fn(),
    sendResetPasswordLink: jest.fn(),
    getResetPasswordLink: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: REPOSITORY_TOKEN, useValue: mockUserRepository },
        { provide: JwtService, useValue: {} },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(REPOSITORY_TOKEN);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('should delegate register call to authService.register', async () => {
      const dto: registerTDO = {
        username: 'test',
        email: 'test@example.com',
        password: 'password123',
      };
      const expected = { message: 'Verification email sent' };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await userService.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should delegate login call to authService.login', async () => {
      const dto: loginTDO = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expected = { token: 'jwt.token' };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await userService.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('getAll', () => {
    it('should return all users from userRepository.find', async () => {
      const users = [createMockUser({ id: 1 }), createMockUser({ id: 2 })];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await userService.getAll();

      expect(mockUserRepository.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });
  });

  describe('getCurrentUser', () => {
    it('should return the user if found', async () => {
      const user = createMockUser();
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await userService.getCurrentUser(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(userService.getCurrentUser(999)).rejects.toThrow(
        new NotFoundException('User is not found'),
      );
    });
  });

  describe('update', () => {
    it('should update both username and password when both are provided', async () => {
      const user = createMockUser({
        username: 'old_name',
        password: 'old_hashed_password',
      });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockAuthService.hashePassword.mockResolvedValue('new_hashed_password');
      mockUserRepository.save.mockImplementation((u) => Promise.resolve(u));

      const dto: updateTDO = {
        username: 'new_name',
        password: 'new_plain_password',
      };

      const result = await userService.update(1, dto);

      expect(mockAuthService.hashePassword).toHaveBeenCalledWith('new_plain_password');
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'new_name',
          password: 'new_hashed_password',
        }),
      );
      expect(result.username).toBe('new_name');
      expect(result.password).toBe('new_hashed_password');
    });

    it('should keep existing password when password is not provided in update', async () => {
      const user = createMockUser({
        username: 'old_name',
        password: 'old_hashed_password',
      });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockAuthService.hashePassword.mockResolvedValue(undefined);
      mockUserRepository.save.mockImplementation((u) => Promise.resolve(u));

      const dto: updateTDO = {
        username: 'new_name_only',
      };

      const result = await userService.update(1, dto);

      expect(result.username).toBe('new_name_only');
      expect(result.password).toBe('old_hashed_password');
    });

    it('should keep existing username when username is not provided in update', async () => {
      const user = createMockUser({
        username: 'old_name',
        password: 'old_hashed_password',
      });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockAuthService.hashePassword.mockResolvedValue('new_hash');
      mockUserRepository.save.mockImplementation((u) => Promise.resolve(u));

      const dto: updateTDO = {
        password: 'new_password',
      };

      const result = await userService.update(1, dto);

      expect(result.username).toBe('old_name');
      expect(result.password).toBe('new_hash');
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        userService.update(999, { username: 'test' }),
      ).rejects.toThrow(new NotFoundException('User is not found'));
    });
  });

  describe('delete', () => {
    it('should allow user to delete their own account', async () => {
      const user = createMockUser({ id: 1 });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.remove.mockResolvedValue(user);

      const payload: payloadTypes = { id: 1, role: UserTypes.USER };

      const result = await userService.delete(payload, 1);

      expect(mockUserRepository.remove).toHaveBeenCalledWith(user);
      expect(result).toBe('User deleted successfuly');
    });

    it('should allow admin to delete another user account', async () => {
      const user = createMockUser({ id: 5 });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.remove.mockResolvedValue(user);

      const adminPayload: payloadTypes = { id: 99, role: 'admin' };

      const result = await userService.delete(adminPayload, 5);

      expect(mockUserRepository.remove).toHaveBeenCalledWith(user);
      expect(result).toBe('User deleted successfuly');
    });

    it('should throw ForbiddenException when non-admin tries to delete another user account', async () => {
      const user = createMockUser({ id: 5 });
      mockUserRepository.findOne.mockResolvedValue(user);

      const normalUserPayload: payloadTypes = { id: 1, role: UserTypes.USER };

      await expect(
        userService.delete(normalUserPayload, 5),
      ).rejects.toThrow(
        new ForbiddenException('Access denied. You are not allawed'),
      );
      expect(mockUserRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if target user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const payload: payloadTypes = { id: 1, role: UserTypes.USER };

      await expect(userService.delete(payload, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProfileImage', () => {
    it('should return the full path of profile image when user has one', async () => {
      const user = createMockUser({ profile_image: 'avatar-123.jpg' });
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await userService.getProfileImage(1);

      expect(result).toContain(path.normalize('/images/users/avatar-123.jpg'));
    });

    it('should throw NotFoundException if user has no profile image', async () => {
      const user = createMockUser({ profile_image: null });
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(userService.getProfileImage(1)).rejects.toThrow(
        new NotFoundException('The profile image is not found'),
      );
    });
  });

  describe('setProfileImage', () => {
    it('should set profile image directly if user has no existing profile image', async () => {
      const user = createMockUser({ profile_image: null });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockImplementation((u) => Promise.resolve(u));

      const result = await userService.setProfileImage(1, 'new-avatar.png');

      expect(user.profile_image).toBe('new-avatar.png');
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(result.profile_image).toBe('new-avatar.png');
    });

    it('should delete previous profile image and set new one if user already has one', async () => {
      const user = createMockUser({ profile_image: 'old-avatar.png' });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockImplementation((u) => Promise.resolve(u));

      const result = await userService.setProfileImage(1, 'new-avatar.png');

      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(user.profile_image).toBe('new-avatar.png');
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.profile_image).toBe('new-avatar.png');
    });
  });

  describe('deleteProfileImage', () => {
    it('should throw BadRequestException if user does not have a profile image', async () => {
      const user = createMockUser({ profile_image: null });
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(userService.deleteProfileImage(1)).rejects.toThrow(
        new BadRequestException('The image is already removed'),
      );
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should remove image file and set profile_image to null when user has profile image', async () => {
      const user = createMockUser({ profile_image: 'avatar-to-delete.png' });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockImplementation((u) => Promise.resolve(u));

      const result = await userService.deleteProfileImage(1);

      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining(path.normalize('/images/users/avatar-to-delete.png')),
      );
      expect(user.profile_image).toBeNull();
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(result).toBe('Image removed successfuly');
    });
  });

  describe('verifyEmail', () => {
    it('should throw NotFoundException if verificationToken on user is null', async () => {
      const user = createMockUser({ verificationToken: null });
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(
        userService.verifyEmail(1, 'some-token'),
      ).rejects.toThrow(
        new NotFoundException('The verificationToken is not provided.'),
      );
    });

    it('should throw BadRequestException if verificationToken does not match', async () => {
      const user = createMockUser({ verificationToken: 'expected-token' });
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(
        userService.verifyEmail(1, 'wrong-token'),
      ).rejects.toThrow(
        new BadRequestException('The verificationToken is invalid.'),
      );
    });

    it('should successfully verify email, set isEmailValidation to true and clear verificationToken', async () => {
      const user = createMockUser({
        verificationToken: 'expected-token',
        isEmailValidation: false,
      });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockImplementation((u) => Promise.resolve(u));

      const result = await userService.verifyEmail(1, 'expected-token');

      expect(user.isEmailValidation).toBe(true);
      expect(user.verificationToken).toBeNull();
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(result).toBe('Your email is verify successfuly .please login');
    });
  });

  describe('sendResetPassword', () => {
    it('should delegate to authService.sendResetPasswordLink', async () => {
      const dto: forgotPasswordDTO = { email: 'user@example.com' };
      const expected = { message: 'Reset email sent' };
      mockAuthService.sendResetPasswordLink.mockResolvedValue(expected);

      const result = await userService.sendResetPassword(dto);

      expect(mockAuthService.sendResetPasswordLink).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('getResetPassword', () => {
    it('should delegate to authService.getResetPasswordLink', async () => {
      const expected = { message: 'Valid token' };
      mockAuthService.getResetPasswordLink.mockResolvedValue(expected);

      const result = await userService.getResetPassword(1, 'token123');

      expect(mockAuthService.getResetPasswordLink).toHaveBeenCalledWith(
        1,
        'token123',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('resetPassword', () => {
    it('should delegate to authService.resetPassword', async () => {
      const dto: resetPasswordDTO = {
        userId: 1,
        resetPasswordToken: 'token123',
        newPassword: 'newpassword123',
      };
      const expected = { message: 'Password reset successfuly' };
      mockAuthService.resetPassword.mockResolvedValue(expected);

      const result = await userService.resetPassword(dto);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });
});
