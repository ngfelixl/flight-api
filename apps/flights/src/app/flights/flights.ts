import { z } from 'zod';

// The datatype for both endpoints is the same
const sliceApiValidator = z.object({
  origin_name: z.string(),
  destination_name: z.string(),
  departure_date_time_utc: z.string(),
  arrival_date_time_utc: z.string(),
  flight_number: z.string(),
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
export type FlightApi = z.infer<typeof flightApiValidator>;
export type SliceApi = z.infer<typeof sliceApiValidator>;

/**
 * Datatype which is used internally once the data is
 * parsed and filtered.
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
