import { HttpService } from '@nestjs/axios';
import { CacheModule, CACHE_MANAGER } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { of } from 'rxjs';
import { Flight, FlightApiResponse } from './flights';
import { FlightsService } from './flights.service';

// Overwrite environment file so that adding additional
// endpoints don't make the tests fail.
jest.mock('../../environments/environment', () => ({
  environment: {
    flightEndpoints: [
      'https://coding-challenge.powerus.de/flight/source1',
      'https://coding-challenge.powerus.de/flight/source2',
    ],
  },
}));

const flightApiFixture = {
  flights: [
    {
      slices: [
        {
          origin_name: 'London',
          destination_name: 'Paris',
          departure_date_time_utc: '2020-01-01T00:00:00.000Z',
          arrival_date_time_utc: '2020-01-01T00:00:00.000Z',
          flight_number: '1234',
          duration: 100,
        },
      ],
      price: 100,
    },
  ],
};

const flightFixture = {
  arrivalDate: new Date('2020-01-01T00:00:00.000Z'),
  departureDate: new Date('2020-01-01T00:00:00.000Z'),
  destination: 'Paris',
  duration: 100,
  flightNumber: '1234',
  id: '1234-2020-01-01T00:00:00.000Z',
  origin: 'London',
  price: 100,
};

describe('FlightsService', () => {
  let service: FlightsService;
  let httpMock: HttpService;
  let cache: Cache;

  beforeEach(async () => {
    httpMock = {
      // Returns the Axios response's data property
      get: jest.fn(() => of({ data: { flights: [] } })),
    } as unknown as HttpService;

    const app = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [FlightsService, { provide: HttpService, useValue: httpMock }],
    }).compile();

    service = app.get<FlightsService>(FlightsService);
    cache = app.get<Cache>(CACHE_MANAGER);
  });

  describe('getFlights', () => {
    it('should create', () => {
      expect(service).toBeTruthy();
    });

    it('should receive an empty array if the endpoint returns null', (done) => {
      service.getFlights().subscribe((flights) => {
        expect(flights).toEqual([]);
        done();
      });
    });

    it('should return an empty array if the responses have zero results each', (done) => {
      service.getFlights().subscribe((flights) => {
        expect(flights).toEqual([]);
        done();
      });
    });

    it('should return the cached values if they are available', (done) => {
      const flight1 = { id: 1 } as unknown as Flight;
      const flight2 = { id: 2 } as unknown as Flight;
      cache.set('https://coding-challenge.powerus.de/flight/source1', [
        flight1,
      ]);
      cache.set('https://coding-challenge.powerus.de/flight/source2', [
        flight2,
      ]);
      const result = [flight1, flight2];

      service.getFlights().subscribe({
        next: (flights) => {
          expect(flights).toEqual(result);
        },
        complete: () => done(),
      });
    });

    it('should return only unique cached flights (by id)', (done) => {
      const flight1 = { id: 1 } as unknown as Flight;
      const flight2 = { id: 2 } as unknown as Flight;
      cache.set('https://coding-challenge.powerus.de/flight/source1', [
        flight1,
        flight2,
      ]);
      cache.set('https://coding-challenge.powerus.de/flight/source2', [
        flight2,
      ]);
      const result = [flight1, flight2];

      service.getFlights().subscribe({
        next: (flights) => {
          expect(flights).toEqual(result);
        },
        complete: () => done(),
      });
    });

    it('should return the http data if there is no entry in the cache', (done) => {
      (httpMock.get as jest.Mock).mockImplementation(() =>
        of({ data: flightApiFixture })
      );

      service.getFlights().subscribe({
        next: (flights) => {
          expect(flights).toEqual([flightFixture]);
        },
        complete: () => {
          done();
        },
      });
    });

    it('should call the cache function with the urls to store the http request results', (done) => {
      const cacheSpy = jest.spyOn(cache, 'get');
      service.getFlights().subscribe({
        complete: () => {
          expect(cacheSpy).toHaveBeenCalledWith(
            'https://coding-challenge.powerus.de/flight/source1'
          );
          expect(cacheSpy).toHaveBeenCalledWith(
            'https://coding-challenge.powerus.de/flight/source2'
          );
          done();
        },
      });
    });

    it('should try to reach the cache for each endpoint', (done) => {
      const cacheSpy = jest.spyOn(cache, 'get');
      service.getFlights().subscribe({
        complete: () => {
          expect(cacheSpy).toHaveBeenCalledWith(
            'https://coding-challenge.powerus.de/flight/source1'
          );
          expect(cacheSpy).toHaveBeenCalledWith(
            'https://coding-challenge.powerus.de/flight/source2'
          );
          done();
        },
      });
    });

    it('should call the cache function with the correct data', (done) => {
      const cacheSpy = jest.spyOn(cache, 'set');
      (httpMock.get as jest.Mock).mockImplementation(() =>
        of({
          data: {
            flights: [
              {
                slices: [
                  {
                    origin_name: 'London',
                    destination_name: 'Paris',
                    departure_date_time_utc: '2020-01-01T00:00:00.000Z',
                    arrival_date_time_utc: '2020-01-01T00:00:00.000Z',
                    flight_number: '1234',
                    duration: 100,
                  },
                ],
                price: 100,
              },
            ],
          } as FlightApiResponse,
        })
      );

      service.getFlights().subscribe({
        complete: () => {
          expect(cacheSpy).toHaveBeenCalledWith(
            'https://coding-challenge.powerus.de/flight/source1',
            [flightFixture],
            { ttl: 3600 }
          );
          done();
        },
      });
    });

    // Error handling
    //   The error handling is not clear from project's description.
    //   The individual endpoint errors are catched and it returns an
    //   empty array. The following tests are applied to this error
    //   behavior.
    it('should return an empty array if the endpoints http get requests error', (done) => {
      (httpMock.get as jest.Mock).mockImplementation(() => {
        throw new Error('error');
      });

      service.getFlights().subscribe((flights) => {
        expect(flights).toEqual([]);
        done();
      });
    });

    it('should return the other endpoints results if one endpoint produces an error', (done) => {
      (httpMock.get as jest.Mock).mockImplementation((url) => {
        if (url === 'https://coding-challenge.powerus.de/flight/source1') {
          throw new Error('error');
        }
        return of({ data: flightApiFixture });
      });

      service.getFlights().subscribe((flights) => {
        expect(flights).toEqual([flightFixture]);
        done();
      });
    });
  });
});
