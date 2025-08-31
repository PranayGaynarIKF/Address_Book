import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { TemplatesModule } from '../templates/templates.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TemplatesModule, AuthModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
