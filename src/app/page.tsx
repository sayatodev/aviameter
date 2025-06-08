"use client";
import useSWR, { Fetcher } from "swr";
import { useEffect, useMemo, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import dynamic from "next/dynamic";
import Link from "next/link";
import styles from "./page.module.css";
import { ConfigModal } from "./components/ConfigModal";
import {
    calculateHaversineDistance,
    calculateMeanSpeed,
    calculateMeanVertSpeed,
    estimateTimeOfArrival,
} from "./utils/math";
import { Pause, PlayArrow } from "@mui/icons-material";
import FlightPathStore from "./utils/flightPathStore";
import "./utils/devtools";

const airportsFetcher: Fetcher<Airport[], string> = (...args) =>
    fetch(...args).then((res) => res.json());
const airportIsValid = (airport: Airport) =>
    airport.status > 0 &&
    !isNaN(Number(airport.lat)) &&
    !isNaN(Number(airport.lon));
const airportIsSized = (airport: Airport) => airport.size === "large";

const flightPathStore = new FlightPathStore(localStorage);

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
    const [config, setConfig] = useState<AviameterConfig>({
        depatureAirport: "",
        arrivalAirport: "",
        trackPoints: [],
        mapOverlayShown: false,
    });
    const [flightPath, setFlightPath] = useState<FlightPath>({
        trackPoints: [],
    });

    // Feedback states
    const [gpsErrored, setGpsErrored] = useState(false);
    const [swAlertOpen, setSwAlertOpen] = useState(false);
    const [configModalOpen, setConfigModalOpen] = useState(false);

    // Leaflet component loading (For SSR Compatibility)
    const Map = useMemo(
        () =>
            dynamic(() => import("@/app/components/Map"), {
                loading: () => <p>Loading Map Data...</p>,
                ssr: false,
            }),
        [],
    );

    const { data: airportsData } = useSWR(`/airports.json`, airportsFetcher);

    // Load flight path from local storage
    useEffect(() => {
        const storedFlightPath = flightPathStore.getFlightPath();
        setFlightPath(storedFlightPath);
    }, []);

    // Update flight track point
    useEffect(() => {
        if (!position || !running) return;
        flightPathStore.addTrackPoint({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            alt: position.coords.altitude ?? 0,
            timestamp: position.timestamp,
        });
        setFlightPath(flightPathStore.getFlightPath());
    }, [position, running]);

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

    const clearFlightPathData = () => {
        flightPathStore.clearFlightPath();
        setFlightPath({ trackPoints: [] });
    };

    return (
        <div className="overflow-x-hidden flex flex-col gap-2 justify-center align-middle w-full h-full">
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
                <div>
                    Estimated Time of Arrival:&nbsp;
                    {config.trackPoints.length > 0 ? (
                        (estimateTimeOfArrival(
                            flightPath.trackPoints,
                            config.trackPoints,
                        )?.toLocaleTimeString() ?? (
                            <>
                                N/A
                                <br />
                                (Available above 1000 ft)
                            </>
                        ))
                    ) : (
                        <>
                            N/A
                            <br />
                            (Load a past flight track first)
                        </>
                    )}
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

                <h3 className="text-center border-b-1 border-black">Map</h3>
                <div className="flex gap-4 justify-center">
                    <button
                        className="text-blue-500"
                        onClick={clearFlightPathData}
                    >
                        Clear Flight Path
                    </button>
                    <button
                        className="text-blue-500"
                        onClick={() => flightPathStore.exportJSON()}
                    >
                        Export Flight Path
                    </button>
                </div>

                <div className="w-[100vw] -mx-[50px] max-w-[768px] h-[90vh] overflow-hidden">
                    <Map
                        hidden={!running || (!gpsErrored && !position)} // Hide map if not running or GPS errored
                        currentCoords={position?.coords}
                        displayLocation={!gpsErrored}
                        config={config}
                        airports={
                            airportsData
                                ?.filter(airportIsValid)
                                .filter(airportIsSized) ?? []
                        }
                        overlayData={{
                            speed: calculateMeanSpeed(recentPositions),
                            altitude: position?.coords.altitude ?? 0,
                            verticalSpeed:
                                calculateMeanVertSpeed(recentPositions),
                        }}
                        flightPath={flightPath}
                    />
                </div>

                <h3 className="text-center border-b-1 mt-2 border-gray"></h3>
                <footer className="text-center mb-15">
                    <Link href="https://github.com/sayatodev/aviameter">
                        View source on Github
                    </Link>
                </footer>

                {/* Modals / Alerts */}
                <Snackbar
                    open={swAlertOpen}
                    autoHideDuration={6000}
                    onClose={() => setSwAlertOpen(false)}
                    className="translate-y-[-50px]"
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

                <ConfigModal
                    open={configModalOpen}
                    onClose={() => setConfigModalOpen(false)}
                    onUpdate={setConfig}
                />
            </div>

            {/* Navigation Bar */}
            <div
                className={`bg-neutral-700 text-neutral-50 text-xl ${styles.navBar}`}
            >
                <button onClick={() => setConfigModalOpen(true)}>
                    <p className="pb-2">Config</p>
                </button>
                <button
                    className={`bg-neutral-700 hover:bg-neutral-800 py-1 ${styles.startButton}`}
                    onClick={() => setRunning(!running)}
                >
                    {running ? (
                        <Pause sx={{ fontSize: 36 }} />
                    ) : (
                        <PlayArrow sx={{ fontSize: 36 }} />
                    )}
                </button>
                <button>
                    <Link href="/guide">
                        <p className="pb-2 text-neutral-50">Guide</p>
                    </Link>
                </button>
            </div>
        </div>
    );
}
