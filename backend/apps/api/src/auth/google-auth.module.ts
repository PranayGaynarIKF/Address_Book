import { Module } from '@nestjs/common';
import { GoogleAuthController } from './google-auth.controller';
import { GoogleAuthService } from './google-auth.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule], // Import EmailModule to use EmailDatabaseService
  controllers: [GoogleAuthController],
  providers: [GoogleAuthService],
  exports: [GoogleAuthService], // Export so GmailAdapter can use it
})
export class GoogleAuthModule {}
