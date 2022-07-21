import { Controller, Get } from '@nestjs/common';

import { FlightsService } from './flights.service';

@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsController: FlightsService) {}

  @Get()
  getData() {
    return this.flightsController.getFlights();
  }
}
