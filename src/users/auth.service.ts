import {
  BadRequestException,
  Controller,
  Injectable,
} from '@nestjs/common';
import { registerTDO } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { loginTDO } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { payloadTypes } from '../utils/payload';
import { MailService } from '../mails/mail.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { forgotPasswordDTO } from './dto/forgot-password.dto';
import { resetPasswordDTO } from './dto/reset-password.dto';

@Injectable()
@Controller()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Create new user
   * @param  registerTDO for create user
   * @returns JWT
   */
  public async register(registerTDO: registerTDO) {
    const { username, email, password } = registerTDO;
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (user) {
      throw new BadRequestException('user is already exist');
    }
    const hashedPassword = await this.hashePassword(password);

    const newUser = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      verificationToken: randomBytes(32).toString('hex'),
    });
    await this.userRepository.save(newUser);

    const verificationLink = await this.generateVerifyLink(
      newUser.id,
      newUser.verificationToken!,
    );
    await this.mailService.sendVerificationEmail(
      newUser,
      verificationLink,
    );
    return {
      message:
        'Verification emali is send .Please verify your email and login.',
    };
  }

  /**
   *Login user
   * @param loginTDO data for login user
   * @returns JWT
   */
  public async login(loginTDO: loginTDO) {
    const { email, password } = loginTDO;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException(
        'Incorrect in email or password',
      );
    }
    const correctPassword = await bcrypt.compare(
      password,
      user.password,
    );
    if (!correctPassword) {
      throw new BadRequestException('Incorrect in password');
    }
    if (!user.isEmailValidation) {
      let verificationToken = user.verificationToken;
      if (!verificationToken) {
        user.verificationToken = randomBytes(32).toString('hex');
        await this.userRepository.save(user);
        verificationToken = user.verificationToken;
      }
      const verificationLink = await this.generateVerifyLink(
        user.id,
        verificationToken,
      );
      await this.mailService.sendVerificationEmail(
        user,
        verificationLink,
      );
      return {
        message:
          'Verification emali is send .Please verify your email and login.',
      };
    }

    const token = await this.generateToken({
      id: user.id,
      role: user.role,
    });

    return { token };
  }

  /**
   * send Reset Password Email
   * @param email user emil
   * @returns success message
   */
  public async sendResetPasswordLink(email: forgotPasswordDTO) {
    const user = await this.userRepository.findOne({
      where: email,
    });

    if (!user) {
      throw new BadRequestException(
        'User with given email is not exist.',
      );
    }
    user.resetPasswordToken = randomBytes(32).toString('hex');
    await this.userRepository.save(user);
    const resetPasswordLink = `${this.config.get<string>('CLIENT_URL')}/reset-password/${user.id}/${user.resetPasswordToken}`;
    await this.mailService.sendResetPasswordEmail(
      user,
      resetPasswordLink,
    );
    return {
      message:
        'Password reset link send to email , check your inbox.',
    };
  }
  /**
   * get reset password link
   * @param userId user id from the link
   * @param resetPasswordToken reset password token from the link
   * @returns success message
   */
  public async getResetPasswordLink(
    userId: number,
    resetPasswordToken: string,
  ) {
    {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new BadRequestException(
          'Reset password is invalid',
        );
      }
      if (
        user.resetPasswordToken === null ||
        user.resetPasswordToken !== resetPasswordToken
      ) {
        throw new BadRequestException(
          'reset password token is invalid',
        );
      }
      return { message: 'Valid reset password token ' };
    }
  }
  /**
   * Reset the password
   * @param dto data for the reset password
   * @returns a success message
   */
  public async resetPassword(dto: resetPasswordDTO) {
    const { userId, resetPasswordToken, newPassword } = dto;
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('Reset password is invalid');
    }
    if (
      resetPasswordToken !== user.resetPasswordToken ||
      user.resetPasswordToken == null
    ) {
      throw new BadRequestException('Reset password is invalid');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    this.userRepository.save(user);
    return { message: 'Password reset successfuly' };
  }

  /**
   * hashing the password
   * @param password text password
   * @returns hashedPassword
   */
  public hashePassword = (password: string) => {
    return bcrypt.hash(password, 10);
  };

  /**
   * Generate JWT
   * @param payload JWT Payload
   * @returns token
   */
  private async generateToken(payload: payloadTypes) {
    return this.jwtService.signAsync(payload);
  }
  /**
   * generate verificationLink
   * @returns
   */
  private async generateVerifyLink(
    userId: number,
    verificationToken: string,
  ) {
    return `${this.config.get<string>('BASE_URL')}/api/users/auth/verify-email/${userId}/${verificationToken}`;
  }
}
