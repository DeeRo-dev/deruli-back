import { Module } from '@nestjs/common';
import { BitetribeService } from './bitetribe.service';
import { BitetribeController } from './bitetribe.controller';

@Module({
  controllers: [BitetribeController],
  providers: [BitetribeService],
})
export class BitetribeModule {}
