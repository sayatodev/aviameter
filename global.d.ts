interface AirportBasic {
    iata: string;
    name: string;
    status: number;
    continent: string;
    type: string;
    size: string;
    iso: string;
}

interface AirportRaw extends AirportBasic {
    lon: string;
    lat: string;
}

type Airport = AirportBasic & {
    key: string;
    label: string;
    lat: number;
    lon: number;
};

type AviameterConfig = {
    departureAirport?: string;
    arrivalAirport?: string;
    referenceTrack: {
        name: string;
        flightPath: FlightPath;
    };
    mapOverlayShown: boolean;
};

type TrackPoint = {
    lat: number;
    lon: number;
    alt: number;
    timestamp: number;
};

type Point = {
    lat: number;
    lon: number;
};

type FlightPath = {
    trackPoints: TrackPoint[];
};
