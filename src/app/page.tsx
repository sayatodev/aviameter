"use client";

import { useEffect, useState } from "react";

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
            prevPos.coords.latitude,
            prevPos.coords.longitude
        );

        // Calculate time difference in seconds
        const timeDiff = (currPos.timestamp - prevPos.timestamp) / 1000;

        if (timeDiff > 0) {
            // Speed in meters per second
            const speed = distance / timeDiff;
            speeds.push(speed);
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
    const [position, setPosition] = useState<GeolocationPosition | null>(null);
    const [recentPositions, setRecentPositions] = useState<
        GeolocationPosition[]
    >([]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (running) {
                const recent = recentPositions;
                while (recent.length > 3) recent.shift();
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setPosition(pos);
                        setRecentPositions([...recent, pos]);
                        console.log(
                            pos.coords.latitude,
                            pos.coords.longitude,
                            pos.timestamp
                        );
                    },
                    () => {
                        throw new Error("Failed to get location");
                    }
                );
            }
        }, 1000);
        return () => clearTimeout(timeout);
    }, [position, running, recentPositions]);

    return (
        <div className="flex flex-col gap-2 justify-center align-middle w-full h-full">
            <button className="bg-gray-200" onClick={() => setRunning(true)}>
                Start
            </button>
            <div className="flex flex-col gap-2 w-fit mx-auto min-w-[20vw]">
                <div>lat: {position?.coords.latitude}</div>
                <div>long: {position?.coords.longitude}</div>
                <div>alt: {position?.coords.altitude}</div>
                <div>spd: {calculateMeanSpeed(recentPositions)} kts</div>
                <div>v/s: {calculateMeanVertSpeed(recentPositions)} fpm</div>
                <div>timestamp: {position?.timestamp}</div>
            </div>
        </div>
    );
}
