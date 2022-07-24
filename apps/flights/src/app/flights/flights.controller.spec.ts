import { Test, TestingModule } from '@nestjs/testing';

import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';

describe('FlightsController', () => {
  let app: TestingModule;
  let flightsServiceMock: FlightsService;

  beforeAll(async () => {
    flightsServiceMock = {
      getFlights: jest.fn(() => 'return-value'),
    } as unknown as FlightsService;

    app = await Test.createTestingModule({
      controllers: [FlightsController],
      providers: [{ provide: FlightsService, useValue: flightsServiceMock }],
    }).compile();
  });

  describe('getFlights', () => {
    it('should trigger the flightsServices getFlights method', () => {
      const flightsController = app.get<FlightsController>(FlightsController);
      flightsController.getFlights();
      expect(flightsServiceMock.getFlights).toHaveBeenCalledTimes(1);
    });

    it('should return the flightServices getFlights return value', () => {
      const flightsController = app.get<FlightsController>(FlightsController);
      const result = flightsController.getFlights();
      expect(result).toBe('return-value');
    });
  });
});
