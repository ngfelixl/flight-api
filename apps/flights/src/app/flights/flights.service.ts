import { HttpService } from '@nestjs/axios';
import {
  CACHE_MANAGER,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { catchError, from, map, Observable, retry, tap, zip } from 'rxjs';
import {
  Flight,
  FlightApiResponse,
  flightApiResponseValidator,
} from './flights';
import { Cache } from 'cache-manager';
import { environment } from '../../environments/environment';

@Injectable()
export class FlightsService {
  constructor(
    private http: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  getFlights(): Observable<Flight[]> {
    const flightRequests = environment.flightEndpoints.map((url) =>
      this.getFlight(url)
    );

    return zip(flightRequests).pipe(
      map((responses) => responses.flat()),
      map(removeDuplicates),
      catchError((err) => {
        throw new HttpException(err.message, err.status);
      })
    );
  }

  private getFlight(url: string): Observable<Flight[]> {
    return from(this.cacheManager.get<Flight[]>(url)).pipe(
      tap((cacheResult) => {
        if (cacheResult === undefined) {
          throw new Error('Cache miss');
        }
      }),
      catchError(() => {
        return this.http.get<FlightApiResponse>(url).pipe(
          retry(3),
          map((response) => flightApiResponseValidator.parse(response.data)),
          map((response) => toFlights(response)),
          tap((flights) =>
            this.cacheManager.set(url, flights, { ttl: 60 * 60 })
          )
        );
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
function removeDuplicates(flights: Flight[]): Flight[] {
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
function toFlights(response: FlightApiResponse): Flight[] {
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
