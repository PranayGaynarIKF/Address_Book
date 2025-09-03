import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/user.dto';

@Injectable()
export class ForgotPasswordService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
        emailSent: true,
      };
    }

    // Generate reset token
    const resetToken = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save reset token to database
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
        isUsed: false,
      },
    });

    // TODO: Send email with reset link
    // For now, we'll just log the token (in production, send email)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: http://localhost:3000/reset-password?token=${resetToken}`);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
      emailSent: true,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    // Find the reset token
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid reset token');
    }

    if (resetToken.isUsed) {
      throw new BadRequestException('Reset token has already been used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { isUsed: true },
    });

    // Invalidate all existing sessions for this user
    await this.prisma.userSession.updateMany({
      where: { userId: resetToken.userId },
      data: { isActive: false },
    });

    return {
      message: 'Password has been reset successfully',
      success: true,
    };
  }

  private generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  async validateResetToken(token: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { valid: false, message: 'Invalid reset token' };
    }

    if (resetToken.isUsed) {
      return { valid: false, message: 'Reset token has already been used' };
    }

    if (resetToken.expiresAt < new Date()) {
      return { valid: false, message: 'Reset token has expired' };
    }

    return { valid: true, message: 'Token is valid' };
  }
}
