import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { registerTDO } from './dto/register.dto';
import { loginTDO } from './dto/login.dto';
import { forgotPasswordDTO } from './dto/forgot-password.dto';
import { resetPasswordDTO } from './dto/reset-password.dto';
import { updateTDO } from './dto/update.dto';
import { payloadTypes } from '../utils/payload';
import { UserTypes } from '../utils/user-types';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  const mockUserPayload: payloadTypes = {
    id: 1,
    role: UserTypes.USER,
  };

  const mockAdminPayload: payloadTypes = {
    id: 99,
    role: UserTypes.ADMIN,
  };

  const mockUserService = {
    register: jest.fn(),
    login: jest.fn(),
    verifyEmail: jest.fn(),
    sendResetPassword: jest.fn(),
    getResetPassword: jest.fn(),
    resetPassword: jest.fn(),
    getCurrentUser: jest.fn(),
    getAll: jest.fn(),
    update: jest.fn(),
    getProfileImage: jest.fn(),
    setProfileImage: jest.fn(),
    deleteProfileImage: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: ConfigService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: Reflector, useValue: {} },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
    expect(userService).toBeDefined();
  });

  describe('register', () => {
    it('should call userService.register and return the result', async () => {
      const dto: registerTDO = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = {
        message: 'Verification emali is send .Please verify your email and login.',
      };
      mockUserService.register.mockResolvedValue(expectedResult);

      const result = await userController.register(dto);

      expect(mockUserService.register).toHaveBeenCalledWith(dto);
      expect(mockUserService.register).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate BadRequestException if user already exists', async () => {
      const dto: registerTDO = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      mockUserService.register.mockRejectedValue(
        new BadRequestException('user is already exist'),
      );

      await expect(userController.register(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should call userService.login and return JWT token', async () => {
      const dto: loginTDO = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = { token: 'jwt.token.here' };
      mockUserService.login.mockResolvedValue(expectedResult);

      const result = await userController.login(dto);

      expect(mockUserService.login).toHaveBeenCalledWith(dto);
      expect(mockUserService.login).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate BadRequestException on invalid credentials', async () => {
      const dto: loginTDO = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      mockUserService.login.mockRejectedValue(
        new BadRequestException('Incorrect in email or password'),
      );

      await expect(userController.login(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verificationEmail', () => {
    it('should call userService.verifyEmail with userId and token', async () => {
      const expectedResult =
        'Your email is verify successfuly .please login';
      mockUserService.verifyEmail.mockResolvedValue(expectedResult);

      const result = await userController.verificationEmail(1, 'valid-token');

      expect(mockUserService.verifyEmail).toHaveBeenCalledWith(
        1,
        'valid-token',
      );
      expect(result).toBe(expectedResult);
    });

    it('should propagate BadRequestException on invalid token', async () => {
      mockUserService.verifyEmail.mockRejectedValue(
        new BadRequestException('The verificationToken is invalid.'),
      );

      await expect(
        userController.verificationEmail(1, 'bad-token'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('should call userService.sendResetPassword with email dto', async () => {
      const dto: forgotPasswordDTO = { email: 'user@example.com' };
      const expected = {
        message: 'Password reset link send to email , check your inbox.',
      };
      mockUserService.sendResetPassword.mockResolvedValue(expected);

      const result = await userController.forgotPassword(dto);

      expect(mockUserService.sendResetPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should propagate BadRequestException if email does not exist', async () => {
      const dto: forgotPasswordDTO = { email: 'unknown@example.com' };
      mockUserService.sendResetPassword.mockRejectedValue(
        new BadRequestException('User with given email is not exist.'),
      );

      await expect(userController.forgotPassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getResetPassword', () => {
    it('should call userService.getResetPassword with userId and resetPasswordToken', async () => {
      const expected = { message: 'Valid reset password token ' };
      mockUserService.getResetPassword.mockResolvedValue(expected);

      const result = await userController.getResetPassword(1, 'token123');

      expect(mockUserService.getResetPassword).toHaveBeenCalledWith(
        1,
        'token123',
      );
      expect(result).toEqual(expected);
    });

    it('should propagate BadRequestException when token is invalid', async () => {
      mockUserService.getResetPassword.mockRejectedValue(
        new BadRequestException('reset password token is invalid'),
      );

      await expect(
        userController.getResetPassword(1, 'bad-token'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('should call userService.resetPassword with dto', async () => {
      const dto: resetPasswordDTO = {
        userId: 1,
        resetPasswordToken: 'token123',
        newPassword: 'newpassword123',
      };
      const expected = { message: 'Password reset successfuly' };
      mockUserService.resetPassword.mockResolvedValue(expected);

      const result = await userController.resetPassword(dto);

      expect(mockUserService.resetPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should propagate error when reset password fails', async () => {
      const dto: resetPasswordDTO = {
        userId: 1,
        resetPasswordToken: 'wrongtoken',
        newPassword: 'newpassword123',
      };
      mockUserService.resetPassword.mockRejectedValue(
        new BadRequestException('Reset password is invalid'),
      );

      await expect(userController.resetPassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getMe', () => {
    it('should call userService.getCurrentUser with payload id', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      mockUserService.getCurrentUser.mockResolvedValue(mockUser);

      const result = await userController.getMe(mockUserPayload);

      expect(mockUserService.getCurrentUser).toHaveBeenCalledWith(
        mockUserPayload.id,
      );
      expect(result).toEqual(mockUser);
    });

    it('should propagate NotFoundException if user not found', async () => {
      mockUserService.getCurrentUser.mockRejectedValue(
        new NotFoundException('User is not found'),
      );

      await expect(userController.getMe(mockUserPayload)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllUsers', () => {
    it('should call userService.getAll and return all users', async () => {
      const usersList = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' },
      ];
      mockUserService.getAll.mockResolvedValue(usersList);

      const result = await userController.getAllUsers();

      expect(mockUserService.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(usersList);
    });
  });

  describe('updateMe', () => {
    it('should call userService.update with payload id and dto', async () => {
      const dto: updateTDO = { username: 'newname' };
      const updatedUser = { id: 1, username: 'newname' };
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await userController.updateMe(mockUserPayload, dto);

      expect(mockUserService.update).toHaveBeenCalledWith(
        mockUserPayload.id,
        dto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('getProfile', () => {
    it('should get profile image path and send file through response', async () => {
      const mockFilePath = 'D:/Projects/Node Js/nestjs-course/images/users/image.png';
      mockUserService.getProfileImage.mockResolvedValue(mockFilePath);

      const mockRes = {
        sendFile: jest.fn(),
      } as unknown as Response;

      await userController.getProfile(mockUserPayload, mockRes);

      expect(mockUserService.getProfileImage).toHaveBeenCalledWith(
        mockUserPayload.id,
      );
      expect(mockRes.sendFile).toHaveBeenCalledWith(mockFilePath);
    });

    it('should propagate NotFoundException if user has no profile image', async () => {
      mockUserService.getProfileImage.mockRejectedValue(
        new NotFoundException('The profile image is not found'),
      );

      const mockRes = {
        sendFile: jest.fn(),
      } as unknown as Response;

      await expect(
        userController.getProfile(mockUserPayload, mockRes),
      ).rejects.toThrow(NotFoundException);
      expect(mockRes.sendFile).not.toHaveBeenCalled();
    });
  });

  describe('uploadProfileImage', () => {
    it('should call userService.setProfileImage with payload id and filename', async () => {
      const mockFile = {
        filename: 'avatar-12345.png',
      } as Express.Multer.File;

      const mockUser = { id: 1, profile_image: 'avatar-12345.png' };
      mockUserService.setProfileImage.mockResolvedValue(mockUser);

      const result = await userController.uploadProfileImage(
        mockUserPayload,
        mockFile,
      );

      expect(mockUserService.setProfileImage).toHaveBeenCalledWith(
        mockUserPayload.id,
        mockFile.filename,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('removeImageProfile', () => {
    it('should call userService.deleteProfileImage with payload id', async () => {
      const expectedMessage = 'Image removed successfuly';
      mockUserService.deleteProfileImage.mockResolvedValue(expectedMessage);

      const result = await userController.removeImageProfile(mockUserPayload);

      expect(mockUserService.deleteProfileImage).toHaveBeenCalledWith(
        mockUserPayload.id,
      );
      expect(result).toBe(expectedMessage);
    });

    it('should propagate BadRequestException if image is already removed', async () => {
      mockUserService.deleteProfileImage.mockRejectedValue(
        new BadRequestException('The image is already removed'),
      );

      await expect(
        userController.removeImageProfile(mockUserPayload),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser', () => {
    it('should call userService.delete with payload and user id', async () => {
      const expected = 'User deleted successfuly';
      mockUserService.delete.mockResolvedValue(expected);

      const result = await userController.deleteUser(mockUserPayload, 1);

      expect(mockUserService.delete).toHaveBeenCalledWith(
        mockUserPayload,
        1,
      );
      expect(result).toBe(expected);
    });

    it('should allow admin to delete another user', async () => {
      const expected = 'User deleted successfuly';
      mockUserService.delete.mockResolvedValue(expected);

      const result = await userController.deleteUser(mockAdminPayload, 5);

      expect(mockUserService.delete).toHaveBeenCalledWith(
        mockAdminPayload,
        5,
      );
      expect(result).toBe(expected);
    });

    it('should propagate ForbiddenException if user is not allowed to delete', async () => {
      mockUserService.delete.mockRejectedValue(
        new ForbiddenException('Access denied. You are not allawed'),
      );

      await expect(
        userController.deleteUser(mockUserPayload, 2),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
