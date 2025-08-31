import { Module } from '@nestjs/common';
import { MailAccountsController } from './mail-accounts.controller';
import { MailAccountsService } from './mail-accounts.service';
import { PrismaModule } from '../common/prisma/prisma.module';
// import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule],
  controllers: [MailAccountsController],
  providers: [MailAccountsService],
  exports: [MailAccountsService],
})
export class MailAccountsModule {}
