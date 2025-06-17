"use client";
import { useContext, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
    airportIsSized,
    airportIsValid,
} from "../utils/airportsHelper";

import FlightPathStore from "../utils/flightPathStore";
import ConfigStore from "../utils/configStore";
import { ConfigContext } from "@/contexts/config";
import { AirportsContext } from "@/contexts/airports";

const _stores = {
    config: new ConfigStore(),
    flightPath: new FlightPathStore(),
};

export default function Main() {
    /* Config */
    const configCtx = useContext(ConfigContext);
    const { config } = configCtx;

    const [flightPath, _setFlightPath] = useState<FlightPath>({
        trackPoints: [],
    });

    /* Airports */
    const airportsData = useContext(AirportsContext);

    /* Register Service Worker */
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").then((registration) => {
                console.log("scope is: ", registration.scope);
                //todo: alert user
            });
        }
    }, []);

    /* Dynamic component loading */
    const Map = useMemo(
        () =>
            dynamic(() => import("@/components/Map"), {
                loading: () => <p>Loading Map Data...</p>,
                ssr: false,
            }),
        [],
    );

    /* Updating flight path */
    // useEffect(() => {
    //     if (!position || !running) return;
    //     stores.flightPath.addTrackPoint({
    //         lat: position.coords.latitude,
    //         lon: position.coords.longitude,
    //         alt: position.coords.altitude ?? 0,
    //         timestamp: position.timestamp,
    //     });
    //     setFlightPath(stores.flightPath.getFlightPath());
    // }, [position, running]);

    /* Rendering */
    return (
        <div className="overflow-x-hidden flex flex-col gap-2 justify-center align-middle w-full h-full">
            <div className="flex flex-col gap-2 w-fit mx-auto min-w-[20vw] md:px-10 px-3">
                <div className="w-[100vw] -mx-[50px] max-w-[768px] h-[90vh] overflow-hidden">
                    <Map
                        config={config}
                        airports={
                            airportsData
                                ?.filter(airportIsValid)
                                .filter(airportIsSized) ?? []
                        }
                        flightPath={flightPath}
                    />
                </div>
            </div>
        </div>
    );
}
