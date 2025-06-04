"use client";

import * as React from "react";
import useSWR, { Fetcher } from "swr";
import {
    MapContainer,
    GeoJSON,
    type GeoJSONProps,
    CircleMarker,
    Circle,
    Polyline,
} from "react-leaflet";

const geojsonFetcher: Fetcher<GeoJSONProps["data"], string> = (...args) =>
    fetch(...args).then((res) => res.json());

interface IMapProps {
    currentCoords?: GeolocationCoordinates;
    displayLocation: boolean;
    airports: Airport[];
    config: AviameterConfig;
    overlayData: {
        speed: number;
        altitude: number;
        verticalSpeed: number;
    };
}

export default function Map(props: IMapProps) {
    const { data: worldData } = useSWR("/planet.geo.json", geojsonFetcher);

    const currentLat = props.currentCoords?.latitude ?? 0;
    const currentLong = props.currentCoords?.longitude ?? 0;

    return worldData ? (
        <MapContainer
            style={{
                width: "100%",
                height: "100%",
            }}
            center={[currentLat, currentLong]}
            maxBoundsViscosity={1.0}
            zoom={4}
            attributionControl={false}
        >
            {props.config.mapOverlayShown && (
                <div className="z-25 left-0 top-0 absolute m-5 bg-gray-800 opacity-70 p-3 flex gap-3">
                    <div className="flex flex-col text-white justify-center items-center">
                        <p className="text-sm font-semibold">SPD</p>
                        <span className="text-lg">
                            {props.overlayData.speed.toFixed(1)} kts
                        </span>
                    </div>
                    <div className="flex flex-col text-white justify-center items-center">
                        <p className="text-sm font-semibold">ALT</p>
                        <span className="text-lg">
                            {props.overlayData.altitude.toFixed(1)} ft
                        </span>
                    </div>
                </div>
            )}

            <GeoJSON
                data={worldData}
                style={{ fillColor: "#deebd8", color: "#a0a89d" }}
            />

            {props.displayLocation && (
                <CircleMarker
                    center={[currentLat, currentLong]}
                    pathOptions={{ fillColor: "blue" }}
                    radius={5}
                />
            )}

            {props.airports.map((airport) => {
                let color = "gray";
                let radius = 2;
                if (airport.iata === props.config.arrivalAirport) {
                    color = "green";
                    radius = 6;
                }
                if (airport.iata === props.config.depatureAirport) {
                    color = "red";
                    radius = 6;
                }
                return (
                    <Circle
                        key={airport.iata + " " + airport.name}
                        center={[Number(airport.lat), Number(airport.lon)]}
                        pathOptions={{
                            fillColor: color,
                            color: color,
                            weight: radius,
                        }}
                        radius={radius}
                    />
                );
            })}

            <Polyline
                positions={props.config.trackPoints.map((point) => [
                    point.lat,
                    point.lon,
                ])}
                pathOptions={{ color: "blue", weight: 2 }}
            />
        </MapContainer>
    ) : (
        <>Loading Map...</>
    );
}
