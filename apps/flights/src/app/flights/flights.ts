import { z } from 'zod';

const dateExpression =
  /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/;

const sliceApiValidator = z.object({
  origin_name: z.string(),
  destination_name: z.string(),
  departure_date_time_utc: z.string().regex(dateExpression),
  arrival_date_time_utc: z.string().regex(dateExpression),
  flight_number: z.string().min(1),
  duration: z.number(),
});

const flightApiValidator = z.object({
  slices: z.array(sliceApiValidator),
  price: z.number(),
});

export const flightApiResponseValidator = z.object({
  flights: z.array(flightApiValidator),
});

export type FlightApiResponse = z.infer<typeof flightApiResponseValidator>;

/**
 * Datatype which is used internally once the data is
 * parsed.
 */
export interface Flight {
  id: string;
  origin: string;
  destination: string;
  departureDate: Date;
  arrivalDate: Date;
  duration: number;
  price: number;
  flightNumber: string;
}
