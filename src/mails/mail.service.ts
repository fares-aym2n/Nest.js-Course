import {
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { User } from '../users/users.entity';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  public async sendVerificationEmail(
    user: User,
    verificationLink: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        from: 'fast@gmail.org',
        subject: 'Verify Email',
        template: 'verify',
        context: { verificationLink, user },
      });
    } catch (err) {
      console.log(err);
      throw new RequestTimeoutException();
    }
  }
  public async sendResetPasswordEmail(
    user: User,
    resetPasswordLink: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        from: 'fast@gmail.org',
        subject: 'Reset Password',
        template: 'reset-password',
        context: { resetPasswordLink, user },
      });
    } catch (err) {
      console.log(err);
      throw new RequestTimeoutException();
    }
  }
}
