"use client";

import { Header } from "@/components/Header";
import { StatisticsPane } from "@/components/StatisticsPane";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ConfigContext } from "@/contexts/config";
import { useEffect, useState } from "react";
import ConfigStore from "../utils/configStore";
import { AirportsContext } from "@/contexts/airports";
import { airportsFetcher, standardizeAirports } from "../utils/airportsHelper";
import useSWR from "swr";
import { StatisticsProvider } from "@/contexts/statistics";

const configStore = new ConfigStore();

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    /* Initialize Config State */
    const [config, setConfig] = useState<AviameterConfig>();

    useEffect(() => {
        configStore.setStorage(localStorage);
        const initialConfig = configStore.getConfig();
        setConfig(initialConfig);
    }, []);

    /* Fetch airports */
    const { data: airportsData } = useSWR(`/airports.json`, airportsFetcher);

    return (
        <AirportsContext.Provider
            value={standardizeAirports(airportsData ?? [])}
        >
            <ConfigContext.Provider
                value={{ store: configStore, config, setConfig }}
            >
                <StatisticsProvider>
                    <Header />
                    <ResizablePanelGroup
                        direction="vertical"
                        className="flex flex-col h-screen pt-12"
                    >
                        <ResizablePanel
                            defaultSize={60}
                            minSize={30}
                            maxSize={80}
                            className="flex-1 overflow-hidden relative"
                        >
                            {children}
                        </ResizablePanel>
                        <ResizableHandle className="min-h-3 -my-2 cursor-row-resize translate-y-4 z-1001 bg-transparent before:opacity-40 before:bg-slate-300 before:w-20 before:h-2 before:select-none before:rounded-full" />
                        <ResizablePanel
                            defaultSize={40}
                            minSize={20}
                            maxSize={50}
                            className="relative shadow-[0px_0px_10px_var(--color-slate-400)] "
                        >
                            <StatisticsPane />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </StatisticsProvider>
            </ConfigContext.Provider>
        </AirportsContext.Provider>
    );
}
