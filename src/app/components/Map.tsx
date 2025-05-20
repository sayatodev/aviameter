"use client";

import * as React from "react";
import useSWR, { Fetcher } from "swr";
import {
    MapContainer,
    GeoJSON,
    type GeoJSONProps,
    CircleMarker,
    Circle,
} from "react-leaflet";

const geojsonFetcher: Fetcher<GeoJSONProps["data"], string> = (...args) =>
    fetch(...args).then((res) => res.json());

interface IMapProps {
    currentCoords?: GeolocationCoordinates;
    displayLocation: boolean;
    airports: Airport[];
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
            {props.airports.map((airport) => (
                <Circle
                    key={airport.iata + " " + airport.name}
                    center={[Number(airport.lat), Number(airport.lon)]}
                    pathOptions={{ fillColor: "gray", color: "gray", weight:2 }}
                    radius={1}
                >
                </Circle>
            ))}
        </MapContainer>
    ) : (
        <>Loading Map...</>
    );
}
