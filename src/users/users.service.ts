import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { registerTDO } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import { loginTDO } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { payloadTypes } from '../utils/payload';
import { updateTDO } from './dto/update.dto';
import { AuthService } from './auth.service';
import path from 'path';
import { cwd } from 'process';
import { unlinkSync } from 'fs';
import { forgotPasswordDTO } from './dto/forgot-password.dto';
import { resetPasswordDTO } from './dto/reset-password.dto';
@Injectable()
@Controller()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Create new user
   * @param  registerTDO for create user
   * @returns JWT
   */
  public async register(registerTDO: registerTDO) {
    return this.authService.register(registerTDO);
  }

  /**
   *Login user
   * @param loginTDO data for login user
   * @returns JWT
   */
  public async login(loginTDO: loginTDO) {
    return this.authService.login(loginTDO);
  }

  /**
   * Get all users
   * @returns all users
   */
  public async getAll(): Promise<User[]> {
    const users = await this.userRepository.find();
    return users;
  }

  /**
   * Get current user
   * @param id id from payload token
   * @returns current user
   */
  public async getCurrentUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User is not found');
    }
    return user;
  }

  /**
   * Update the user
   * @param id id from payload token
   * @param dto  data for update user
   * @returns updated user
   */
  public async update(
    id: number,
    dto: updateTDO,
  ): Promise<User> {
    const { username, password } = dto;
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User is not found');
    }

    user.password =
      (await this.authService.hashePassword(password)) ??
      user.password;
    user.username = username ?? user.username;
    return this.userRepository.save(user);
  }

  /**
   *
   * @param payload payload from JWT
   * @param id id of user you want to delete
   * @returns success message
   */
  public async delete(
    payload: payloadTypes,
    id: number,
  ): Promise<string> {
    const user = await this.getCurrentUser(id);

    if (user?.id === payload.id || payload.role === 'admin') {
      await this.userRepository.remove(user);
      return 'User deleted successfuly';
    }
    throw new ForbiddenException(
      'Access denied. You are not allawed',
    );
  }

  /**
   *
   * @param id id of the looged in user
   * @returns profile image path
   */
  public async getProfileImage(id: number): Promise<string> {
    const user = await this.getCurrentUser(id);
    if (!user.profile_image) {
      throw new NotFoundException(
        'The profile image is not found',
      );
    }
    return path.join(
      cwd(),
      `/images/users/${user.profile_image}`,
    );
  }

  /**
   *
   * @param id id of the looged in user
   * @param profileImage profile image
   * @returns user
   */
  public async setProfileImage(
    id: number,
    profileImage: string,
  ): Promise<User> {
    const user = await this.getCurrentUser(id);
    if (user.profile_image === null) {
      user.profile_image = profileImage;
    } else {
      await this.deleteProfileImage(id);
      user.profile_image = profileImage;
    }
    return this.userRepository.save(user);
  }

  /**
   *
   * @param id id of the logged in user
   * @returns success message
   */
  public async deleteProfileImage(id: number): Promise<string> {
    const user = await this.getCurrentUser(id);
    if (user.profile_image === null) {
      throw new BadRequestException(
        'The image is already removed',
      );
    }
    const imagePath = path.join(
      cwd(),
      `/images/users/${user.profile_image}`,
    );
    unlinkSync(imagePath);
    user.profile_image = null;

    await this.userRepository.save(user);
    return 'Image removed successfuly';
  }
  public async verifyEmail(
    userId: number,
    verificationToken: string,
  ) {
    const user = await this.getCurrentUser(userId);
    if (user.verificationToken === null) {
      throw new NotFoundException(
        'The verificationToken is not provided.',
      );
    }
    if (user.verificationToken !== verificationToken) {
      throw new BadRequestException(
        'The verificationToken is invalid.',
      );
    }
    user.isEmailValidation = true;
    user.verificationToken = null;
    await this.userRepository.save(user);
    return 'Your email is verify successfuly .please login';
  }
  /**
   * send Reset Password Email
   * @param email user emil
   * @returns success message
   */
  public sendResetPassword(body: forgotPasswordDTO) {
    return this.authService.sendResetPasswordLink(body);
  }
  /**
   * get reset password link
   * @param userId user id from the link
   * @param resetPasswordToken reset password token from the link
   * @returns success message
   */

  public getResetPassword(
    userId: number,
    resetPasswordToken: string,
  ) {
    return this.authService.getResetPasswordLink(
      userId,
      resetPasswordToken,
    );
  }
  /**
   * Reset the password
   * @param dto data for the reset password
   * @returns a success message
   */
  public resetPassword(dto: resetPasswordDTO) {
    return this.authService.resetPassword(dto);
  }
}
