import type { Fetcher } from "swr";
import { calculateHaversineDistance } from "./math";
import { uniqueBy } from "./helpers";
import { Length } from "./units";

// SWR Fetcher for airports.json
export const airportsFetcher: Fetcher<AirportRaw[], string> = (...args) =>
    fetch(...args).then((res) => res.json());

// Filters
export const airportIsValid = (airport: Airport | AirportRaw) =>
    airport.status > 0 &&
    !isNaN(Number(airport.lat)) &&
    !isNaN(Number(airport.lon));
export const airportIsSized = (airport: Airport) => airport.size === "large";

export function getNearestAirport(
    position: GeolocationPosition,
    airports?: Airport[],
): { airport: Airport; distance: Length } | null {
    if (!airports || airports.length === 0) return null;

    const airportDistanceMap = airports
        .filter(airportIsValid)
        .map((airport) => ({
            airport,
            distance: calculateHaversineDistance(
                Number(airport.lat),
                Number(airport.lon),
                position.coords.latitude,
                position.coords.longitude,
            ),
        }))
        .sort((a, b) => a.distance.value - b.distance.value);

    return airportDistanceMap[0] || null;
}

export function standardizeAirports(airports: AirportRaw[]): Airport[] {
    const filteredAirports = airports.filter(airportIsValid).map((airport) => ({
        ...airport,
        key: `${airport.iata} ${airport.name}`.replaceAll(" ", "_"),
        label: `${airport.iata} - ${airport.name}`,
        lat: Number(airport.lat),
        lon: Number(airport.lon),
    }));
    return uniqueBy(filteredAirports, "key");
}
