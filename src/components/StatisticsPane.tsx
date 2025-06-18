import { M_to_FT, M_to_NM } from "@/utils/math";
import { AirportsContext } from "@/contexts/airports";
import { ConfigContext } from "@/contexts/config";
import { StatisticsContext } from "@/contexts/statistics";
import { JSX, useContext, useEffect, useState } from "react";

function StatisticsSection({
    title,
    value,
    span,
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
        <div className={spans[span ?? 1]}>
            <div className="bg-slate-300 p-2 rounded-sm">
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
    const { referenceTrack, arrivalAirport } = config ?? {};
    console.log("StatisticsPane statistics:", statistics);
    return (
        <div className="bg-slate-600 text-white p-4 pt-8 -mb-2 absolute w-full h-full z-1000">
            <div className="grid grid-cols-8 gap-2">
                <StatisticsSection
                    title="Speed"
                    value={`${statistics.speed?.toFixed(1)} kts`}
                    span={2}
                />
                <StatisticsSection
                    title="V/S"
                    value={`${statistics.verticalSpeed?.toFixed(1)} fpm`}
                    span={2}
                />
                <StatisticsSection
                    title="Altitude"
                    value={`${M_to_FT(statistics.position?.coords.altitude ?? 0).toFixed(1)} ft`}
                    span={2}
                />
                <StatisticsSection
                    title="UTC Time"
                    value={<Clock />}
                    span={2}
                />
                <StatisticsSection
                    title="Flight Status"
                    value={
                        <>
                            {statistics.eta ? (
                                `ETA $
                            {statistics.eta.toLocaleTimeString()}`
                            ) : !referenceTrack?.flightPath.trackPoints
                                  .length ? (
                                <span className="text-slate-600 text-sm">
                                    Load previous flight track log for ETA
                                </span>
                            ) : (
                                <span className="text-slate-600 text-sm">
                                    ETA unavailable during takeoff/landing stage
                                </span>
                            )}
                            <br />
                            {statistics.distanceToDestination ? (
                                `${M_to_NM(
                                    statistics.distanceToDestination,
                                ).toFixed(1)} NM to ${
                                    airports.find(
                                        (airport) =>
                                            airport.key === arrivalAirport,
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
                        statistics.position ? (
                            `${statistics.position.coords.latitude.toFixed(
                                4,
                            )}, ${statistics.position.coords.longitude.toFixed(
                                4,
                            )}`
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
