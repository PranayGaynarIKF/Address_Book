import { Module } from '@nestjs/common';
import { DynamicOAuthController } from './dynamic-oauth.controller';
import { DynamicOAuthService } from './dynamic-oauth.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule], // Import EmailModule to use EmailDatabaseService
  controllers: [DynamicOAuthController],
  providers: [DynamicOAuthService],
  exports: [DynamicOAuthService], // Export so other modules can use it
})
export class DynamicOAuthModule {}
