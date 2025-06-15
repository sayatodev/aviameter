interface Airport {
    iata: string;
    lon: string;
    iso: string;
    status: number;
    name: string;
    continent: string;
    type: string;
    lat: string;
    size: string;
}

type AviameterConfig = {
    departureAirport?: string;
    arrivalAirport?: string;
    trackPoints: TrackPoint[];
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
    trackPoints: Array<TrackPoint>;
};
