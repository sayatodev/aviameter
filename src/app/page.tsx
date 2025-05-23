"use client";
import useSWR, { Fetcher } from "swr";
import { useEffect, useMemo, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import dynamic from "next/dynamic";
import Link from "next/link";

const airportsFetcher: Fetcher<Airport[], string> = (...args) =>
    fetch(...args).then((res) => res.json());
const airportIsValid = (airport: Airport) =>
    airport.status > 0 &&
    !isNaN(Number(airport.lat)) &&
    !isNaN(Number(airport.lon));
const airportIsSized = (airport: Airport) => airport.size === "large";

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
            currPos.coords.longitude,
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
    lon2: number,
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

    // Feedback states
    const [gpsErrored, setGpsErrored] = useState(false);
    const [swAlertOpen, setSwAlertOpen] = useState(false);

    // Leaflet component loading (For SSR Compatibility)
    const Map = useMemo(
        () =>
            dynamic(() => import("@/app/components/Map"), {
                loading: () => <p>A map is loading</p>,
                ssr: false,
            }),
        [],
    );

    const { data: airportsData } = useSWR(`/airports.json`, airportsFetcher);

    // Register Service Worker
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").then((registration) => {
                console.log("scope is: ", registration.scope);
                setSwAlertOpen(true);
            });
        }
    }, []);

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
                                .filter(airportIsValid)
                                .map((item) => ({
                                    iata: item.iata,
                                    distance: calculateHaversineDistance(
                                        Number(item.lat),
                                        Number(item.lon),
                                        pos.coords.latitude,
                                        pos.coords.longitude,
                                    ),
                                }))
                                .sort((a, b) => a.distance - b.distance);
                            setNearestAirport({
                                data: airportsData.find(
                                    (i) =>
                                        i.iata === airportDistanceMap[0].iata,
                                ),
                                distance:
                                    airportDistanceMap[0].distance *
                                    0.000539957, // nm
                            });
                        }

                        setGpsErrored(false);
                    },

                    (/* error */) => {
                        setGpsErrored(true);
                        setRunning(false);
                    },
                );
            }
        }, 1000);
        return () => clearTimeout(timeout);
    });

    return (
        <div className="overflow-x-hidden flex flex-col gap-2 justify-center align-middle w-full h-full">
            <button
                className="bg-gray-200 hover:bg-gray-300 py-1"
                onClick={() => setRunning(!running)}
            >
                {running ? "Pause" : "Start"}
            </button>
            <div className="flex flex-col gap-2 w-fit mx-auto min-w-[20vw] md:px-10 px-3">
                {gpsErrored && (
                    <Alert variant="outlined" severity="error">
                        Failed to load GPS data
                    </Alert>
                )}
                <h3 className="text-center border-b-1 border-black">
                    Coordinates
                </h3>
                <div>lat: {position?.coords.latitude}</div>
                <div>long: {position?.coords.longitude}</div>
                {/*m to ft*/}
                <div>
                    alt:&nbsp;
                    {((position?.coords.altitude ?? 0) * 3.28084).toFixed(2)} ft
                </div>

                <h3 className="text-center border-b-1 border-black">Rates</h3>
                <div>
                    spd: {calculateMeanSpeed(recentPositions).toFixed(2)} kts
                </div>
                <div>
                    v/s: {calculateMeanVertSpeed(recentPositions).toFixed(2)}{" "}
                    fpm
                </div>

                <h3 className="text-center border-b-1 border-black">Time</h3>
                <div>
                    GPS Time:&nbsp;
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
                <Snackbar
                    open={swAlertOpen}
                    autoHideDuration={6000}
                    onClose={() => setSwAlertOpen(false)}
                >
                    <Alert
                        variant="outlined"
                        severity="success"
                        className="mt-5"
                    >
                        This website&apos;s data has been downloaded and can be
                        used offline.
                    </Alert>
                </Snackbar>

                <h3 className="text-center border-b-1 border-black">Map</h3>

                {/*running and gps initialized*/}
                {running && (gpsErrored || position) ? (
                    <div className="w-[100vw] -mx-[50px] max-w-[768px] h-[90vh] overflow-hidden">
                        <Map
                            currentCoords={position?.coords}
                            displayLocation={!gpsErrored}
                            airports={
                                airportsData
                                    ?.filter(airportIsValid)
                                    .filter(airportIsSized) ?? []
                            }
                        />
                    </div>
                ) : (
                    <p className="text-center mb-10">Press start to show map</p>
                )}

                <h3 className="text-center border-b-1 mt-2 border-gray"></h3>
                <footer className="text-center mb-2">
                    <Link href="https://github.com/sayatodev/aviameter">
                        View source on Github
                    </Link>
                </footer>
            </div>
        </div>
    );
}
