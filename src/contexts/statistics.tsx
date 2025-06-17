import { getNearestAirport } from "@/app/utils/airportsHelper";
import { createContext, useContext, useEffect, useState } from "react";
import { AirportsContext } from "./airports";
import { calculateMeanSpeed, calculateMeanVertSpeed } from "@/app/utils/math";

type Statistics = {
    position?: GeolocationPosition;
    recentPositions: GeolocationPosition[];
    nearestAirport: { airport: Airport; distance: number } | null;
    speed?: number;
    verticalSpeed?: number;
    gpsErrored: boolean;
};

export const StatisticsContext = createContext<Statistics>({
    position: undefined,
    recentPositions: [],
    nearestAirport: null,
    speed: undefined,
    verticalSpeed: undefined,
    gpsErrored: false,
});

export const StatisticsProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [statistics, setStatistics] = useState<Statistics>({
        position: undefined,
        recentPositions: [],
        nearestAirport: null,
        speed: undefined,
        verticalSpeed: undefined,
        gpsErrored: false,
    });
    const [position, setPosition] = useState<GeolocationPosition | undefined>(
        undefined,
    );
    const [recentPositions, setRecentPositions] = useState<
        GeolocationPosition[]
    >([]);

    const airports = useContext(AirportsContext);

    useEffect(() => {
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
        }
    }, [position]);

    useEffect(() => {
        if (position) {
            const recent = [...recentPositions, position].slice(-10);
            console.log("GPS position updated:", {
                position,
                recentPositions: recent,
                nearestAirport: getNearestAirport(position, airports),
                speed: calculateMeanSpeed(recent),
                verticalSpeed: calculateMeanVertSpeed(recent),
                gpsErrored: false,
            });
            setStatistics({
                position,
                recentPositions: recent,
                nearestAirport: getNearestAirport(position, airports),
                speed: calculateMeanSpeed(recent),
                verticalSpeed: calculateMeanVertSpeed(recent),
                gpsErrored: false,
            });
        }
    }, [position, airports, recentPositions]);

    return (
        <StatisticsContext.Provider value={statistics}>
            {children}
        </StatisticsContext.Provider>
    );
};
