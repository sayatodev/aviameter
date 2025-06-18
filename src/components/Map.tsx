"use client";

import useSWR, { Fetcher } from "swr";
import {
    MapContainer,
    GeoJSON,
    type GeoJSONProps,
    CircleMarker,
    Circle,
    Polyline,
    Popup,
    useMap,
} from "react-leaflet";
import { calculateHaversineDistance } from "@/utils/math";
import { useContext, useEffect, useRef, useState } from "react";
import { StatisticsContext } from "@/contexts/statistics";
import { M_to_FT } from "@/utils/units";

const geojsonFetcher: Fetcher<GeoJSONProps["data"], string> = (...args) =>
    fetch(...args).then((res) => res.json());

interface IMapProps {
    currentTimestamp?: number;
    airports: Airport[];
    config?: AviameterConfig;
    flightPath: FlightPath;
}

export default function Map(props: IMapProps) {
    const locationFocused = useRef(false);
    const [center, setCenter] = useState<[number, number]>([0, 0]);

    const statistics = useContext(StatisticsContext);
    const { data: worldData } = useSWR("/planet.geo.json", geojsonFetcher);

    const { position, gpsErrored, speed, verticalSpeed } = statistics;
    const displayLocation = !gpsErrored && !!position;

    const currentCoords = position?.coords;
    const currentLat = currentCoords?.latitude ?? 0;
    const currentLong = currentCoords?.longitude ?? 0;
    const altitude = currentCoords?.altitude ?? 0;

    useEffect(() => {
        if (!locationFocused.current && displayLocation) {
            setCenter([currentLat, currentLong]);
            locationFocused.current = true;
        }
    }, [displayLocation, currentLat, currentLong]);

    // Config
    const config = props.config;
    const { units } = config ?? {};

    return worldData ? (
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
                    center={[currentLat, currentLong]}
                    zoom={4}
                    zoomControl={false}
                    attributionControl={false}
                >
                    <ChangeView center={center} />

                    <GeoJSON
                        data={worldData}
                        style={{ fillColor: "#deebd8", color: "#a0a89d" }}
                    />

                    {displayLocation && (
                        <CircleMarker
                            center={[currentLat, currentLong]}
                            pathOptions={{ fillColor: "blue" }}
                            radius={5}
                        />
                    )}

                    {props.airports.map((airport) => {
                        let color = "gray";
                        let radius = 4;
                        if (airport.key === config?.arrivalAirport) {
                            color = "green";
                            radius = 6;
                        }
                        if (airport.key === config?.departureAirport) {
                            color = "red";
                            radius = 6;
                        }
                        return (
                            <Circle
                                key={airport.key}
                                center={[
                                    Number(airport.lat),
                                    Number(airport.lon),
                                ]}
                                pathOptions={{
                                    fillColor: color,
                                    color: color,
                                    weight: radius,
                                }}
                                radius={radius}
                            >
                                <Popup>
                                    <div className="font-semibold text-xs text-center">
                                        {airport.iata}
                                    </div>
                                    <br />
                                    <div className="text-xs">
                                        {airport.name?.replaceAll(
                                            "International",
                                            "Int'l",
                                        )}
                                    </div>
                                    <br />
                                    <div className="italic text-xs text-center">
                                        {calculateHaversineDistance(
                                            currentCoords?.latitude ?? 0,
                                            currentCoords?.longitude ?? 0,
                                            airport.lat,
                                            airport.lon,
                                        ).nm(1)}
                                        &nbsp;nm
                                    </div>
                                </Popup>
                            </Circle>
                        );
                    })}

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

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);

    return null;
}
