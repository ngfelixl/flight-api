import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { catchError, map, Observable, zip } from 'rxjs';
import { Flight, FlightApiResponse, flightApiResponseValidator } from './flights';

@Injectable()
export class FlightsService {

  constructor(private http: HttpService) {}

  getFlights(): Observable<Flight[]> {
    return zip(
      this.getFlight('https://coding-challenge.powerus.de/flight/source1'),
      this.getFlight('https://coding-challenge.powerus.de/flight/source2'),
    ).pipe(
      map(responses => responses.flat()),
      map(removeDuplicates),
      catchError(err => { throw new HttpException(err.message, err.status) }),
    );
  }

  getFlight(url: string): Observable<Flight[]> {
    return this.http.get<FlightApiResponse>(url).pipe(
      map(data => flightApiResponseValidator.parse(data)),
      map(data => mapApiResponseToFlights(data)),
    );
  }
}

function removeDuplicates(flights: Flight[]): Flight[] {
  const uniqueFlights = new Map<string, Flight>();

  for (const flight of flights) {
    uniqueFlights.set(flight.id, flight);
  }

  return [...uniqueFlights.values()];
}


function mapApiResponseToFlights(data: FlightApiResponse): Flight[] {
  const flights = new Set<Flight>();

  for (const apiFlights of data.flights) {
    for (const slice of apiFlights.slices) {
      const flight: Flight = {
        id: slice.flight_number,
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
