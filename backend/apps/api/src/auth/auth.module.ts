import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { GoogleAuthModule } from './google-auth.module';
import { DynamicOAuthModule } from './dynamic-oauth.module'; // Added
import { UsersModule } from '../users/users.module';
import { ForgotPasswordService } from '../users/forgot-password.service';

@Module({
  imports: [
    GoogleAuthModule,
    DynamicOAuthModule, // Add the new dynamic OAuth module
    UsersModule, // Add UsersModule to access UsersService
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [ForgotPasswordService],
  exports: [JwtModule], // Export JWT for other modules to use
})
export class AuthModule {}
