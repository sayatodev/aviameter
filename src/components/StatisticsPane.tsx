import { AirportsContext } from "@/contexts/airports";
import { ConfigContext } from "@/contexts/config";
import { StatisticsContext } from "@/contexts/statistics";
import { type LengthUnit, type SpeedUnit, Length } from "@/utils/units";
import { JSX, useContext, useEffect, useState } from "react";

function StatisticsValueSection<
    T extends "speed" | "length",
    U extends T extends "speed" ? SpeedUnit : LengthUnit,
    V extends
        | {
              to: (unit: U, precision?: number) => number;
          }
        | undefined,
>({
    title,
    value,
    aviationUnit,
    metricUnit,
    unitsSystem = "aviation",
    precision = 1,
    span = 2,
}: {
    title: string;
    value: V;
    aviationUnit: U;
    metricUnit: U;
    unitsSystem?: "aviation" | "metric";
    precision?: number;
    span?: 1 | 2 | 4 | 6 | 8;
}) {
    return (
        <StatisticsSection
            title={title}
            value={
                unitsSystem === "aviation" ? (
                    <>
                        {value ? value.to(aviationUnit, precision) : "--"}{" "}
                        {aviationUnit}
                    </>
                ) : (
                    <>
                        {value ? value.to(metricUnit, precision) : "--"}{" "}
                        {metricUnit}
                    </>
                )
            }
            span={span}
        />
    );
}

function StatisticsSection({
    title,
    value,
    span = 2,
}: {
    title: string;
    value: string | number | JSX.Element;
    span?: 1 | 2 | 4 | 6 | 8;
}) {
    const spans = {
        1: "col-span-1",
        2: "col-span-2",
        4: "col-span-4",
        6: "col-span-6",
        8: "col-span-8",
    };
    return (
        <div className={`${spans[span ?? 1]}`}>
            <div className="bg-slate-300 h-full p-2 rounded-sm">
                <p className="text-xs text-slate-800">{title}</p>
                <span className="text-md text-black">{value}</span>
            </div>
        </div>
    );
}

export function StatisticsPane() {
    const statistics = useContext(StatisticsContext);
    const airports = useContext(AirportsContext);
    const { config } = useContext(ConfigContext);

    const { coords } = statistics.position ?? {};
    const { referenceTrack, arrivalAirport, units } = config ?? {};
    const altitude = coords?.altitude ? new Length(coords.altitude) : undefined;

    return (
        <div className="bg-slate-600 text-white p-4 pt-8 -mb-2 absolute w-full h-full z-1000">
            <div className="grid grid-cols-8 gap-2">
                <StatisticsValueSection
                    title="Speed"
                    value={statistics.speed}
                    aviationUnit="kt"
                    metricUnit="km/h"
                    unitsSystem={units}
                />
                <StatisticsValueSection
                    title="V/S"
                    value={statistics.verticalSpeed}
                    aviationUnit="fpm"
                    metricUnit="m/s"
                    unitsSystem={units}
                />
                <StatisticsValueSection
                    title="Altitude"
                    value={altitude}
                    aviationUnit="ft"
                    metricUnit="m"
                    unitsSystem={units}
                />
                <StatisticsSection title="UTC Time" value={<Clock />} />
                <StatisticsSection
                    title="Flight Status"
                    value={
                        <>
                            {statistics.gpsErrored && (
                                <>
                                    <span className="text-rose-800 text-sm">
                                        GPS Error
                                    </span>
                                    <br />
                                </>
                            )}
                            {statistics.eta ? (
                                `ETA $
                            {statistics.eta.toLocaleTimeString()}`
                            ) : !referenceTrack?.flightPath.trackPoints
                                  .length ? (
                                <span className="text-slate-600 text-sm">
                                    Load previous flight track log for ETA
                                </span>
                            ) : (coords?.altitude ?? 0) < 100 ? (
                                <span className="text-slate-600 text-sm">
                                    On ground
                                </span>
                            ) : (
                                <span className="text-slate-600 text-sm">
                                    ETA unavailable during takeoff/landing stage
                                </span>
                            )}
                            <br />
                            {statistics.distanceToDestination ? (
                                (units === "aviation"
                                    ? statistics.distanceToDestination.nm(1)
                                    : statistics.distanceToDestination.km(1)) +
                                (units === "aviation" ? " nm" : " km") +
                                ` to ${
                                    airports.find(
                                        ({ key }) => key === arrivalAirport,
                                    )?.name ?? arrivalAirport
                                }`
                            ) : config?.arrivalAirport ? (
                                <span className="text-slate-600 text-sm">
                                    Could not calculate distance to destination
                                </span>
                            ) : (
                                <span className="text-slate-600 text-sm">
                                    Set arrival airport in configurations to
                                    show distance
                                </span>
                            )}
                        </>
                    }
                    span={8}
                />
                <StatisticsSection
                    title="Position"
                    value={
                        coords ? (
                            `${coords.latitude.toFixed(
                                4,
                            )}, ${coords.longitude.toFixed(4)}`
                        ) : (
                            <span className="text-slate-600 text-sm">
                                Waiting for GPS signal...
                            </span>
                        )
                    }
                    span={4}
                />
                <StatisticsSection
                    title="GPS Last Updated"
                    value={
                        statistics.position
                            ? new Date(
                                  statistics.position.timestamp,
                              ).toLocaleTimeString()
                            : "N/A"
                    }
                    span={4}
                />
            </div>
        </div>
    );
}

interface ClockProps {
    className?: string;
}
export function Clock({ className }: ClockProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className={className}>
            <span className="text-md text-black">
                {currentTime.toISOString().slice(11, 19)}
            </span>
        </div>
    );
}
