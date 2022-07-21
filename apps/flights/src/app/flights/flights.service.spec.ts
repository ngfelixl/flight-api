import { Test } from '@nestjs/testing';

import { FlightsService } from './flights.service';

describe('AppService', () => {
  let service: FlightsService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [FlightsService],
    }).compile();

    service = app.get<FlightsService>(FlightsService);
  });

  describe('getData', () => {
    it('should return "Welcome to flights!"', () => {
      expect(service.getFlights()).toEqual({ message: 'Welcome to flights!' });
    });
  });
});
