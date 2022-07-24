import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { catchError, from, map, Observable, of, retry, tap, zip } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Flight,
  FlightApiResponse,
  flightApiResponseValidator,
} from './flights';

@Injectable()
export class FlightsService {
  private readonly logger = new Logger(FlightsService.name);

  constructor(
    private readonly http: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  /**
   * Get flights returns a union of all flights received
   * from all ressources. The union of all flights contains
   * unique flights. Each endpoint has it's own cache and if
   * the cache is missed, a retry strategy of three retries.
   *
   * Use this function to receive the flights in the
   * controller. NestJS will subscribe to this zip'd observable
   * under the hood.
   *
   * @returns A stream of flights
   */
  getFlights(): Observable<Flight[]> {
    const flightRequests = environment.flightEndpoints.map((url) =>
      this.getFlight(url)
    );

    return zip(flightRequests).pipe(
      map((responses) => responses.flat()),
      map(removeDuplicatesByid)
    );
  }

  /**
   * This function triggers the actual http requests to
   * the endpoint. It must be called for each flight.
   * The function caches the response for a duration of
   * 1h.
   * @param url
   * @returns
   */
  private getFlight(url: string): Observable<Flight[]> {
    return from(this.cacheManager.get<Flight[]>(url)).pipe(
      tap((cacheResult) => {
        if (cacheResult === undefined) {
          throw new Error('Cache miss');
        }
      }),
      catchError(() => {
        return this.http.get(url).pipe(
          retry(3),
          map((response) => flightApiResponseValidator.parse(response.data)),
          map((response) => responseToFlights(response)),
          tap((flights) =>
            this.cacheManager.set(url, flights, { ttl: 60 * 60 })
          )
        );
      }),
      // The error strategy is not 100% clear from the project
      // description. Include the catchError to not throw any errors
      // thrown by the endpoints and return an empty array.
      // If you exclude this catchError, you should add one
      // in line 46 (last operator in the zip'd observable),
      // maybe with a Service Unavailable Exception.
      catchError((err) => {
        this.logger.warn(`${url}`, err.message);
        return of([]);
      })
    );
  }
}

/**
 * This function removes the duplicate flights from the array
 * based on the flight id made of the flight number and the
 * departure date.
 * @param flights Any flights array
 * @returns An array of flights with unique flight IDs
 */
function removeDuplicatesByid(flights: Flight[]): Flight[] {
  const uniqueFlights = new Map<string, Flight>();

  for (const flight of flights) {
    uniqueFlights.set(flight.id, flight);
  }

  return [...uniqueFlights.values()];
}

/**
 * This function maps the API response having nested arrays
 * to an array having actual flight objects with an ID made
 * of the flight number and the departure date.
 * @param data The data which the API provides
 * @returns An array of flights with an ID
 */
function responseToFlights(response: FlightApiResponse): Flight[] {
  const flights = new Set<Flight>();

  for (const apiFlights of response.flights) {
    for (const slice of apiFlights.slices) {
      const flight: Flight = {
        id: `${slice.flight_number}-${slice.departure_date_time_utc}`,
        origin: slice.origin_name,
        destination: slice.destination_name,
        departureDate: new Date(slice.departure_date_time_utc),
        arrivalDate: new Date(slice.arrival_date_time_utc),
        duration: slice.duration,
        price: apiFlights.price,
        flightNumber: slice.flight_number,
      };
      flights.add(flight);
    }
  }

  return [...flights];
}
