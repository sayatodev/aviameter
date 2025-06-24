"use client";

import useSWR, { Fetcher } from "swr";
import {
    MapContainer,
    GeoJSON,
    type GeoJSONProps,
    CircleMarker,
    Polyline,
} from "react-leaflet";
import { useContext } from "react";
import { StatisticsContext } from "@/contexts/statistics";
import { M_to_FT } from "@/utils/units";

const geojsonFetcher: Fetcher<GeoJSONProps["data"], string> = (...args) =>
    fetch(...args).then((res) => res.json());

interface IAirportMapProps {
    currentTimestamp?: number;
    config?: AviameterConfig;
    flightPath: FlightPath;
}

export default function AirportMap(props: IAirportMapProps) {
    const statistics = useContext(StatisticsContext);
    const { data: mapData } = useSWR("/vhhh.geo.json", geojsonFetcher);

    const { position, gpsErrored, speed, verticalSpeed } = statistics;
    const displayLocation = !gpsErrored && !!position;

    const currentCoords = position?.coords;
    const currentLat = currentCoords?.latitude ?? 0;
    const currentLong = currentCoords?.longitude ?? 0;
    const altitude = currentCoords?.altitude ?? 0;

    // Config
    const config = props.config;
    const { units } = config ?? {};

    return mapData ? (
        <div className="w-full h-full">
            {config?.mapOverlayShown && (
                <div className="z-1000 left-0 top-0 absolute m-5 bg-slate-800 rounded-lg opacity-70 p-3 flex gap-3">
                    <div className="flex flex-col text-white justify-center items-center">
                        <p className="text-xs font-semibold">SPD</p>
                        <span className="text-lg">
                            {units === "aviation"
                                ? speed?.kt(1) + " kt"
                                : speed?.kmh(1) + " km/h"}
                        </span>
                    </div>
                    <div className="flex flex-col text-white justify-center items-center">
                        <p className="text-xs font-semibold">ALT</p>
                        <span className="text-lg">
                            {units === "aviation"
                                ? M_to_FT(altitude).toFixed(1) + " ft"
                                : altitude.toFixed(1) + " m"}
                        </span>
                    </div>
                    <div className="flex flex-col text-white justify-center items-center">
                        <p className="text-xs font-semibold">V/S</p>
                        <span className="text-lg">
                            {units === "aviation"
                                ? verticalSpeed?.fpm(1) + " fpm"
                                : verticalSpeed?.SI(1) + " m/s"}
                        </span>
                    </div>
                </div>
            )}

            <div className="absolute top-0 left-0 w-full h-full">
                <MapContainer
                    className="w-full h-full"
                    center={[22.310, 113.915]}
                    zoom={12}
                    zoomControl={false}
                    attributionControl={false}
                >
                    <GeoJSON
                        data={mapData}
                        style={{ fillColor: "#deebd8", color: "#a0a89d" }}
                    />

                    {displayLocation && (
                        <CircleMarker
                            center={[currentLat, currentLong]}
                            pathOptions={{ fillColor: "blue" }}
                            radius={5}
                        />
                    )}

                    {config && (
                        <Polyline
                            positions={config.referenceTrack.flightPath.trackPoints.map(
                                (point) => [point.lat, point.lon],
                            )}
                            pathOptions={{ color: "gray", weight: 2 }}
                        />
                    )}

                    <Polyline
                        positions={props.flightPath.trackPoints.map((point) => [
                            point.lat,
                            point.lon,
                        ])}
                        pathOptions={{
                            color: "blue",
                            weight: 1,
                            dashArray: "5,5",
                        }}
                    />
                </MapContainer>
            </div>
        </div>
    ) : (
        <>Loading Map...</>
    );
}
