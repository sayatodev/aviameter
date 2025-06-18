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
} from "react-leaflet";
import { calculateHaversineDistance, M_to_NM } from "@/utils/math";
import { useContext } from "react";
import { StatisticsContext } from "@/contexts/statistics";

const geojsonFetcher: Fetcher<GeoJSONProps["data"], string> = (...args) =>
    fetch(...args).then((res) => res.json());

interface IMapProps {
    currentTimestamp?: number;
    airports: Airport[];
    config?: AviameterConfig;
    flightPath: FlightPath;
}

export default function Map(props: IMapProps) {
    const statistics = useContext(StatisticsContext);
    const { data: worldData } = useSWR("/planet.geo.json", geojsonFetcher);

    const { position, gpsErrored, speed, verticalSpeed } = statistics;
    const displayLocation = !gpsErrored && !!position;

    const currentCoords = position?.coords;
    const currentLat = currentCoords?.latitude ?? 0;
    const currentLong = currentCoords?.longitude ?? 0;
    const altitude = currentCoords?.altitude ?? 0;

    // Config
    const config = props.config;

    return worldData ? (
        <div className="w-full h-full">
            {config?.mapOverlayShown && (
                <div className="z-1000 left-0 top-0 absolute m-5 bg-slate-800 rounded-lg opacity-70 p-3 flex gap-3">
                    <div className="flex flex-col text-white justify-center items-center">
                        <p className="text-xs font-semibold">SPD</p>
                        <span className="text-lg">{speed?.toFixed(1)} kts</span>
                    </div>
                    <div className="flex flex-col text-white justify-center items-center">
                        <p className="text-xs font-semibold">ALT</p>
                        <span className="text-lg">
                            {(altitude * 3.28084).toFixed(1)} ft
                        </span>
                    </div>
                    <div className="flex flex-col text-white justify-center items-center">
                        <p className="text-xs font-semibold">V/S</p>
                        <span className="text-lg">
                            {verticalSpeed?.toFixed(1)} fpm
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
                                        {M_to_NM(
                                            calculateHaversineDistance(
                                                currentCoords?.latitude ?? 0,
                                                currentCoords?.longitude ?? 0,
                                                airport.lat,
                                                airport.lon,
                                            ),
                                        ).toFixed(1)}
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
