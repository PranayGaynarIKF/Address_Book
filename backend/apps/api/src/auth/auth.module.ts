import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { GoogleAuthModule } from './google-auth.module';
import { DynamicOAuthModule } from './dynamic-oauth.module'; // Added

@Module({
  imports: [
    GoogleAuthModule,
    DynamicOAuthModule, // Add the new dynamic OAuth module
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [],
  exports: [JwtModule], // Export JWT for other modules to use
})
export class AuthModule {}
