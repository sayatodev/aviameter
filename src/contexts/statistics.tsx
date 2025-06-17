import { getNearestAirport } from "@/app/utils/airportsHelper";
import { createContext, useContext, useEffect, useState } from "react";
import { AirportsContext } from "./airports";
import {
    calculateHaversineDistance,
    calculateMeanSpeed,
    calculateMeanVertSpeed,
    estimateTimeOfArrival,
} from "@/app/utils/math";
import { ConfigContext } from "./config";
import FlightPathStore from "@/app/utils/flightPathStore";

type Statistics = {
    position?: GeolocationPosition;
    recentPositions: GeolocationPosition[];
    nearestAirport: { airport: Airport; distance: number } | null;
    speed?: number;
    verticalSpeed?: number;
    gpsErrored: boolean;
    eta: Date | null;
    flightPath: FlightPath;
    distanceToDestination?: number | null;
};

const flightPathStore = new FlightPathStore();

const defaultStatistics: Statistics = {
    position: undefined,
    recentPositions: [],
    nearestAirport: null,
    speed: undefined,
    verticalSpeed: undefined,
    gpsErrored: false,
    eta: null,
    flightPath: {
        trackPoints: [],
    },
    distanceToDestination: null,
};

export const StatisticsContext = createContext<Statistics>(defaultStatistics);

export const StatisticsProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [statistics, setStatistics] = useState<Statistics>(defaultStatistics);
    const [position, setPosition] = useState<GeolocationPosition | undefined>(
        undefined,
    );
    const [recentPositions, setRecentPositions] = useState<
        GeolocationPosition[]
    >([]);
    const [flightPath, setFlightPath] = useState<FlightPath>({
        trackPoints: [],
    });

    const airports = useContext(AirportsContext);
    const { config } = useContext(ConfigContext);
    const { referenceTrack, arrivalAirport } = config ?? {};

    useEffect(() => {
        flightPathStore.setStorage(localStorage);

        if ("geolocation" in navigator) {
            console.log("Starting GPS watchPosition...");
            const watcher = navigator.geolocation.watchPosition(
                (position) => {
                    setPosition(position);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setStatistics((prev) => ({
                        ...prev,
                        gpsErrored: true,
                    }));
                },
                { enableHighAccuracy: true },
            );
            return () => {
                if ("geolocation" in navigator) {
                    console.log("Stopping GPS watchPosition...");
                    navigator.geolocation.clearWatch(watcher);
                }
            };
        }
    }, []);

    useEffect(() => {
        if (position) {
            setRecentPositions((prev) => {
                const updated = [...prev, position].slice(-10);
                return updated;
            });
            flightPathStore.addTrackPoint({
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                alt: position.coords.altitude ?? 0,
                timestamp: position.timestamp,
            });
            setFlightPath(flightPathStore.getFlightPath());
        }
    }, [position]);

    useEffect(() => {
        if (position) {
            const recent = [...recentPositions, position].slice(-10);

            setStatistics({
                position,
                recentPositions: recent,
                nearestAirport: getNearestAirport(position, airports),
                speed: calculateMeanSpeed(recent),
                verticalSpeed: calculateMeanVertSpeed(recent),
                gpsErrored: false,
                eta: referenceTrack?.flightPath.trackPoints.length
                    ? estimateTimeOfArrival(
                          flightPath.trackPoints,
                          referenceTrack.flightPath.trackPoints,
                      )
                    : null,
                flightPath: {
                    trackPoints: recent.map((pos) => ({
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        alt: pos.coords.altitude ?? 0,
                        timestamp: pos.timestamp,
                    })),
                },
                distanceToDestination: config?.arrivalAirport
                    ? calculateHaversineDistance(
                          position.coords.latitude,
                          position.coords.longitude,
                          airports.find(
                              (airport) => airport.key === arrivalAirport,
                          )?.lat ?? 0,
                          airports.find(
                              (airport) => airport.key === arrivalAirport,
                          )?.lon ?? 0,
                      )
                    : null,
            });
        }
    }, [
        position,
        airports,
        recentPositions,
        flightPath,
        referenceTrack,
        arrivalAirport,
    ]);

    return (
        <StatisticsContext.Provider value={statistics}>
            {children}
        </StatisticsContext.Provider>
    );
};
