import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { UserService } from './users.service';
import { registerTDO } from './dto/register.dto';
import { loginTDO } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import type { payloadTypes } from '../utils/payload';
import { CurrentUser } from './decorators/auth.decorator';
import { Roles } from './decorators/user-roles.decorator';
import { UserTypes } from '../utils/user-types';
import { AuthRolesGuard } from './guards/auth-role.guard';
import { updateTDO } from './dto/update.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { forgotPasswordDTO } from './dto/forgot-password.dto';
import { resetPasswordDTO } from './dto/reset-password.dto';
import {
  ApiSecurity,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { uploadImageDTO } from './dto/upload-image.dto';

@Controller('/api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // POST: ~/api/users/auth/register
  @Post('/auth/register')
  public register(@Body() body: registerTDO) {
    return this.userService.register(body);
  }

  // POST: ~/api/users/auth/login
  @HttpCode(200)
  @Post('/auth/login')
  public login(@Body() body: loginTDO) {
    return this.userService.login(body);
  }

  // GET: ~/api/users/auth/verify-email/:userId/:verificationToken
  @Get('/auth/verify-email/:userId/:verificationToken')
  public verificationEmail(
    @Param('userId')
    userId: number,

    @Param('verificationToken')
    verificationToken: string,
  ) {
    return this.userService.verifyEmail(
      userId,
      verificationToken,
    );
  }

  // POST: ~/api/users/forgot-password
  @Post('forgot-password')
  public forgotPassword(@Body() email: forgotPasswordDTO) {
    return this.userService.sendResetPassword(email);
  }

  // GET: ~/api/users/reset-password/:userId/:resetPasswordToken
  @Get('reset-password/:userId/:resetPasswordToken')
  public getResetPassword(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('resetPasswordToken') resetPasswordToken: string,
  ) {
    return this.userService.getResetPassword(
      userId,
      resetPasswordToken,
    );
  }

  // POST: ~/api/users/reset-password
  @Post('reset-password')
  public resetPassword(@Body() body: resetPasswordDTO) {
    return this.userService.resetPassword(body);
  }

  // GET: ~/api/users/me
  @Get('/me')
  @UseGuards(AuthGuard)
  @ApiSecurity('bearer')
  public getMe(@CurrentUser() payload: payloadTypes) {
    return this.userService.getCurrentUser(payload.id);
  }

  // GET: ~/api/users
  @Get()
  @UseGuards(AuthRolesGuard)
  @Roles(UserTypes.ADMIN)
  @ApiSecurity('bearer')
  public getAllUsers() {
    return this.userService.getAll();
  }

  // PATCH: ~/api/users/me
  @Patch('/me')
  @UseGuards(AuthGuard)
  @ApiSecurity('bearer')
  public updateMe(
    @CurrentUser() payload: payloadTypes,
    @Body() body: updateTDO,
  ) {
    return this.userService.update(payload.id, body);
  }

  // GET: ~/api/users/me/profile-image
  @Get('/me/profile-image')
  @UseGuards(AuthGuard)
  @ApiSecurity('bearer')
  public async getProfile(
    @CurrentUser() payload: payloadTypes,
    @Res()
    res: Response,
  ) {
    const filePath = await this.userService.getProfileImage(
      payload.id,
    );

    return res.sendFile(filePath);
  }

  // POST: ~/api/users/me/upload_image
  @Post('/me/upload_image')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('profile_image'))
  @ApiSecurity('bearer')
  @ApiBody({ type: uploadImageDTO })
  @ApiConsumes('multipart/form-data')
  public uploadProfileImage(
    @CurrentUser() payload: payloadTypes,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.setProfileImage(
      payload.id,
      file.filename,
    );
  }

  // DELETE: ~/api/users/me/profile-image
  @Delete('/me/profile-image')
  @UseGuards(AuthGuard)
  @ApiSecurity('bearer')
  public removeImageProfile(
    @CurrentUser() payload: payloadTypes,
  ) {
    return this.userService.deleteProfileImage(payload.id);
  }

  // DELETE: ~/api/users/:id
  @Delete('/:id')
  @UseGuards(AuthGuard)
  @ApiSecurity('bearer')
  public deleteUser(
    @CurrentUser() payload: payloadTypes,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userService.delete(payload, id);
  }
}
