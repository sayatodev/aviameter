"use client";

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
    hidden?: boolean;
    currentCoords?: GeolocationCoordinates;
    currentTimestamp?: number;
    displayLocation: boolean;
    airports: Airport[];
    config?: AviameterConfig;
    overlayData: {
        speed: number;
        altitude: number;
        verticalSpeed: number;
    };
    flightPath: FlightPath;
}

export default function Map(props: IMapProps) {
    const { data: worldData } = useSWR("/planet.geo.json", geojsonFetcher);

    // If the map is hidden, return an empty fragment
    if (props.hidden) {
        return <></>;
    }
    const currentLat = props.currentCoords?.latitude ?? 0;
    const currentLong = props.currentCoords?.longitude ?? 0;

    // Config
    const config = props.config ?? {
        departureAirport: "",
        arrivalAirport: "",
        trackPoints: [],
        mapOverlayShown: false,
    };

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
            {config.mapOverlayShown && (
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
                            {(props.overlayData.altitude * 3.28084).toFixed(1)}{" "}
                            ft
                        </span>
                    </div>
                    <div className="flex flex-col text-white justify-center items-center">
                        <p className="text-sm font-semibold">V/S</p>
                        <span className="text-lg">
                            {props.overlayData.verticalSpeed.toFixed(1)} fpm
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
                if (airport.iata === config.arrivalAirport) {
                    color = "green";
                    radius = 6;
                }
                if (airport.iata === config.departureAirport) {
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
                positions={config.trackPoints.map((point) => [
                    point.lat,
                    point.lon,
                ])}
                pathOptions={{ color: "gray", weight: 2 }}
            />

            <Polyline
                positions={props.flightPath.trackPoints.map((point) => [
                    point.lat,
                    point.lon,
                ])}
                pathOptions={{ color: "blue", weight: 1, dashArray: "5,5" }}
            />
        </MapContainer>
    ) : (
        <>Loading Map...</>
    );
}
