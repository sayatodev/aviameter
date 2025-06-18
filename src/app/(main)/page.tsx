"use client";
import { useContext, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { ConfigContext } from "@/contexts/config";
import { AirportsContext } from "@/contexts/airports";
import { StatisticsContext } from "@/contexts/statistics";
import { airportIsSized } from "@/utils/airportsHelper";

export default function Main() {
    /* Config */
    const configCtx = useContext(ConfigContext);
    const { config } = configCtx;

    /* Flight Path */
    const { flightPath } = useContext(StatisticsContext);

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

    return (
        <div className="overflow-x-hidden flex flex-col gap-2 justify-center align-middle w-full h-full">
            <div className="flex flex-col gap-2 w-fit mx-auto min-w-[20vw] md:px-10 px-3">
                <div className="w-[100vw] -mx-[50px] max-w-[768px] h-[90vh] overflow-hidden">
                    <Map
                        config={config}
                        airports={airportsData.filter(airportIsSized)}
                        flightPath={flightPath}
                    />
                </div>
            </div>
        </div>
    );
}
