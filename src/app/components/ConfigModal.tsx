import { useEffect, useMemo, useState } from "react";
import { KMLParser } from "../utils/kmlParser";
import {
    Autocomplete,
    createFilterOptions,
    Switch,
    TextField,
} from "@mui/material";

export interface IConfigModalProps {
    airports: Airport[];
    config: AviameterConfig;
    open: boolean;
    onClose: () => void;
    onUpdate: (config: AviameterConfig) => void;
}

export function ConfigModal(props: IConfigModalProps) {
    const { airports, onUpdate, config } = props;
    const [inputData, setInputData] = useState<AviameterConfig>(config);

    const airportCandidates = useMemo(() => {
        return airports.map((airport) => ({
            value: airport.iata,
            label: airport.name,
        }));
    }, [airports]);
    const airportFilterOptions = createFilterOptions({
        limit: 10,
        stringify: (option: (typeof airportCandidates)[number]) =>
            `${option.value} ${option.label}`,
    });

    useEffect(() => {
        onUpdate(inputData);
    }, [inputData, onUpdate]);

    return props.open ? (
        <div className="z-20 fixed inset-0 flex items-center justify-center p-3">
            <div
                className="fixed inset-0 bg-black opacity-70"
                onClick={props.onClose}
            ></div>
            <div className="z-21 bg-white p-6 rounded shadow-lg">
                <h2 className="text-xl font-bold mb-4">Configuration</h2>

                <h3 className="text-lg font-semibold mb-2">Flight Route</h3>
                <div className="flex items-center mb-4 gap-2">
                    <Autocomplete
                        className="flex-1"
                        options={airportCandidates}
                        getOptionLabel={(option) =>
                            `${option.value} - ${option.label}`
                        }
                        filterOptions={airportFilterOptions}
                        value={
                            airportCandidates.find(
                                (a) => a.value === config.departureAirport,
                            ) || null
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Departure Airport"
                                variant="outlined"
                            />
                        )}
                        renderValue={(option) => option?.value || ""}
                        onChange={(event, newValue) => {
                            setInputData({
                                ...inputData,
                                departureAirport: newValue
                                    ? newValue.value
                                    : "",
                            });
                        }}
                    />
                    <Autocomplete
                        className="flex-1 text-nowrap"
                        options={airportCandidates}
                        getOptionLabel={(option) =>
                            `${option.value} - ${option.label}`
                        }
                        filterOptions={airportFilterOptions}
                        value={
                            airportCandidates.find(
                                (a) => a.value === config.arrivalAirport,
                            ) || null
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Arrival Airport"
                                variant="outlined"
                            />
                        )}
                        renderValue={(option) => option?.value || ""}
                        onChange={(event, newValue) => {
                            setInputData({
                                ...inputData,
                                arrivalAirport: newValue ? newValue.value : "",
                            });
                        }}
                    />
                </div>

                <h3 className="text-lg font-semibold mb-2">Add Track Layer</h3>
                <div className="mb-4">
                    <label>
                        <span className="text-gray-700">Upload KML data</span>
                    </label>
                    <input
                        type="file"
                        accept=".kml"
                        className="block w-full p-2 border border-gray-300 rounded"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    try {
                                        const kmlString = event.target
                                            ?.result as string;
                                        const parser = new KMLParser();
                                        const positions =
                                            parser.getPositions(kmlString);
                                        setInputData({
                                            ...inputData,
                                            trackPoints: positions,
                                        });
                                    } catch (error) {
                                        console.error(
                                            "KML parsing error:",
                                            error,
                                        );
                                    }
                                };
                                reader.readAsText(file);
                            }
                        }}
                    />
                </div>

                <h3 className="text-lg font-semibold mb-2">Map Overlay</h3>
                <div className="flex items-center mb-4">
                    <Switch
                        checked={config.mapOverlayShown}
                        onChange={(e) =>
                            setInputData({
                                ...inputData,
                                mapOverlayShown: e.target.checked,
                            })
                        }
                        color="primary"
                    />
                    <span className="text-gray-700">Show map overlay</span>
                </div>
            </div>
        </div>
    ) : null;
}
