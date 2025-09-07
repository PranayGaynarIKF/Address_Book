import { Module } from '@nestjs/common';
import { VcfController } from './vcf.controller';
import { VcfService } from './vcf.service';

@Module({
  controllers: [VcfController],
  providers: [VcfService],
  exports: [VcfService],
})
export class VcfModule {}
