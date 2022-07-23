import { HttpModule } from '@nestjs/axios';
import { CacheModule, Module } from '@nestjs/common';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';

@Module({
  imports: [CacheModule.register(), HttpModule],
  controllers: [FlightsController],
  providers: [FlightsService],
})
export class FlightsModule {}
