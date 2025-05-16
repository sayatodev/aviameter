"use client";
import useSWR, { Fetcher } from "swr";
import { useEffect, useState } from "react";

const airportsFetcher: Fetcher<Airport[], string> = (...args) =>
    fetch(...args).then((res) => res.json());

function calculateMeanSpeed(positions: GeolocationPosition[]): number {
    if (!positions || positions.length < 2) {
        return 0;
    }

    const speeds: number[] = [];

    // Calculate speeds between consecutive positions
    for (let i = 1; i < positions.length; i++) {
        const prevPos = positions[i - 1];
        const currPos = positions[i];

        // Calculate distance between points using Haversine formula
        const distance = calculateHaversineDistance(
            prevPos.coords.latitude,
            prevPos.coords.longitude,
            currPos.coords.latitude,
            currPos.coords.longitude
        );

        // Calculate time difference in seconds
        const timeDiff = (currPos.timestamp - prevPos.timestamp) / 1000;

        if (timeDiff > 0) {
            // Speed in meters per second
            const speed = distance / timeDiff;
            speeds.push(speed);
        } else {
            speeds.push(0);
        }
    }

    // Calculate mean speed
    if (speeds.length === 0) {
        return 0;
    }
    const totalSpeed = speeds.reduce((sum, speed) => sum + speed, 0);
    return (totalSpeed / speeds.length) * 1.94384; // m/s to kts
}

function calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) *
            Math.cos(phi2) *
            Math.sin(deltaLambda / 2) *
            Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

function calculateMeanVertSpeed(positions: GeolocationPosition[]): number {
    if (!positions || positions.length < 2) {
        return 0;
    }

    const vertSpeeds: number[] = [];

    for (let i = 1; i < positions.length; i++) {
        const prevPos = positions[i - 1];
        const currPos = positions[i];

        if (!currPos.coords.altitude || !prevPos.coords.altitude) {
            vertSpeeds.push(0);
            continue;
        }
        const altDiff = currPos.coords.altitude - prevPos.coords.altitude;

        // Calculate time difference in seconds
        const timeDiff = (currPos.timestamp - prevPos.timestamp) / 1000;

        if (timeDiff > 0) {
            // v/s in meters per second
            const vertSpeed = altDiff / timeDiff;
            vertSpeeds.push(vertSpeed);
        }
    }

    // Calculate mean v/s
    if (vertSpeeds.length === 0) {
        return 0;
    }
    const totalSpeed = vertSpeeds.reduce((sum, speed) => sum + speed, 0);
    return (totalSpeed / vertSpeeds.length) * 196.850394; // m/s to fpm
}

export default function Home() {
    const [running, setRunning] = useState(false);
    const [position, setPosition] = useState<GeolocationPosition>();
    const [recentPositions, setRecentPositions] = useState<
        GeolocationPosition[]
    >([]);
    const [nearestAirport, setNearestAirport] = useState<{
        data?: Airport;
        distance: number;
    }>();

    const { data: airportsData } = useSWR(`/airports.json`, airportsFetcher);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (running) {
                const recent = recentPositions;
                while (recent.length > 5) recent.shift();
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setPosition(pos);
                        setRecentPositions([...recent, pos]);

                        // closest airport
                        if (airportsData) {
                            const airportDistanceMap = airportsData
                                .filter(
                                    (i) =>
                                        i.status > 0 &&
                                        !isNaN(Number(i.lat)) &&
                                        !isNaN(Number(i.lon))
                                )
                                .map((item) => ({
                                    iata: item.iata,
                                    distance: calculateHaversineDistance(
                                        Number(item.lat),
                                        Number(item.lon),
                                        pos.coords.latitude,
                                        pos.coords.longitude
                                    ),
                                }))
                                .sort((a, b) => a.distance - b.distance);
                            setNearestAirport({
                                data: airportsData.find(
                                    (i) => i.iata === airportDistanceMap[0].iata
                                ),
                                distance:
                                    airportDistanceMap[0].distance *
                                    0.000539957, // nm
                            });
                        }
                    },
                    () => {
                        throw new Error("Failed to get location");
                    }
                );
            }
        }, 1000);
        return () => clearTimeout(timeout);
    });

    return (
        <div className="flex flex-col gap-2 justify-center align-middle w-full h-full">
            <button className="bg-gray-200" onClick={() => setRunning(true)}>
                Start
            </button>
            <div className="flex flex-col gap-2 w-fit mx-auto min-w-[20vw]">
                <h3 className="text-center border-b-1 border-black">
                    Coordinates
                </h3>
                <div>lat: {position?.coords.latitude}</div>
                <div>long: {position?.coords.longitude}</div>
                {/*m to ft*/}
                <div>alt: {(position?.coords.altitude ?? 0) * 3.28084} ft</div>

                <h3 className="text-center border-b-1 border-black">Rates</h3>
                <div>spd: {calculateMeanSpeed(recentPositions)} kts</div>
                <div>v/s: {calculateMeanVertSpeed(recentPositions)} fpm</div>

                <h3 className="text-center border-b-1 border-black">Time</h3>
                <div>
                    GPS Time:{" "}
                    {position?.timestamp &&
                        new Date(position?.timestamp).toLocaleTimeString()}
                </div>
                {nearestAirport && (
                    <>
                        <h3 className="text-center border-b-1 border-black">
                            Nearest Field
                        </h3>
                        <div className="flex gap-2">
                            <div className="bg-gray-500 rounded-full text-white px-2 my-auto text-xs h-[1.5em] mt-1">
                                {nearestAirport?.data?.iata}
                            </div>
                            <span>{nearestAirport?.data?.name}</span>
                        </div>
                        <span className="-mt-2">
                            Distance: {nearestAirport?.distance.toFixed(3)} nm
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
