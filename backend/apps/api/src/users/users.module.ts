import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ForgotPasswordService } from './forgot-password.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, ForgotPasswordService],
  exports: [UsersService, ForgotPasswordService],
})
export class UsersModule {}
