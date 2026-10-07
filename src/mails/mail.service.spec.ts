import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { RequestTimeoutException } from '@nestjs/common';
import { User } from '../users/users.entity';

describe('MailService', () => {
  let mailService: MailService;
  let mailerService: MailerService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: 'user@example.com',
    username: 'testuser',
  } as User;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(mailService).toBeDefined();
    expect(mailerService).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    const verificationLink = 'http://localhost:3000/verify?token=123';

    it('should successfully send verification email with correct parameters', async () => {
      mockMailerService.sendMail.mockResolvedValue({ messageId: '123' });

      await mailService.sendVerificationEmail(mockUser, verificationLink);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: mockUser.email,
        from: 'fast@gmail.org',
        subject: 'Verify Email',
        template: 'verify',
        context: { verificationLink, user: mockUser },
      });
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should catch error and throw RequestTimeoutException when mail sending fails', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP connection error'));

      await expect(
        mailService.sendVerificationEmail(mockUser, verificationLink),
      ).rejects.toThrow(RequestTimeoutException);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('sendResetPasswordEmail', () => {
    const resetPasswordLink = 'http://localhost:3000/reset?token=abc';

    it('should successfully send reset password email with correct parameters', async () => {
      mockMailerService.sendMail.mockResolvedValue({ messageId: '456' });

      await mailService.sendResetPasswordEmail(mockUser, resetPasswordLink);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: mockUser.email,
        from: 'fast@gmail.org',
        subject: 'Reset Password',
        template: 'reset-password',
        context: { resetPasswordLink, user: mockUser },
      });
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should catch error and throw RequestTimeoutException when mail sending fails', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP timeout'));

      await expect(
        mailService.sendResetPasswordEmail(mockUser, resetPasswordLink),
      ).rejects.toThrow(RequestTimeoutException);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
