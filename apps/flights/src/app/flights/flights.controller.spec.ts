import { Test, TestingModule } from '@nestjs/testing';

import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';

describe('FlightsController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [FlightsController],
      providers: [FlightsService],
    }).compile();
  });

  describe('getData', () => {
    it('should return "Welcome to flights!"', () => {
      const appController = app.get<FlightsController>(FlightsController);
      expect(appController.getData()).toEqual({
        message: 'Welcome to flights!',
      });
    });
  });
});
