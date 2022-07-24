import { Controller, Get } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Flight } from './flights';

import { FlightsService } from './flights.service';

@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsController: FlightsService) {}

  /**
   * This is the GET endpoint for the flights. It returns
   * a stream of flights. Because we return an Observable,
   * NestJS will subscribe to this observable and returns
   * the first emitted element to the client.
   * @returns
   */
  @Get()
  getFlights(): Observable<Flight[]> {
    return this.flightsController.getFlights();
  }
}
