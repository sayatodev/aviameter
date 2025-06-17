import { M_to_FT } from "@/app/utils/math";
import { StatisticsContext } from "@/contexts/statistics";
import { JSX, useContext, useEffect, useState } from "react";

function StatisticsSection({
    title,
    value,
    span,
}: {
    title: string;
    value: string | number | JSX.Element;
    span?: number;
}) {
    return (
        <div className={`col-span-${span ?? 1}`}>
            <div className="bg-slate-300 p-2 rounded-sm">
                <p className="text-xs text-slate-800">{title}</p>
                <span className="text-md text-black">{value}</span>
            </div>
        </div>
    );
}

export function StatisticsPane() {
    const statistics = useContext(StatisticsContext);
    console.log("StatisticsPane statistics:", statistics);
    return (
        <div className="bg-slate-600 text-white p-4 pt-8 grid grid-cols-8 gap-2 -mb-2 absolute w-full h-full z-1000">
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
            <StatisticsSection title="UTC Time" value={<Clock />} span={2} />
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
