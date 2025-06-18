import z from "zod";

export const defaultConfig: AviameterConfig = {
    departureAirport: "",
    arrivalAirport: "",
    referenceTrack: {
        name: "",
        flightPath: {
            trackPoints: [],
        },
    },
    mapOverlayShown: false,
    units: "aviation",
};

export default class ConfigStore {
    storage?: Storage;

    constructor() {}

    checkStorage(): asserts this is this & { storage: Storage } {
        if (!this.storage) {
            throw new Error("Storage not set. Call setStorage() first.");
        }
    }

    setStorage(storage: Storage): void {
        this.storage = storage;
    }

    getConfig(): AviameterConfig {
        this.checkStorage();
        const config = this.storage.getItem("config");
        // console.debug("ConfigStore.getConfig", config);
        if (config) {
            const configSchema: z.ZodSchema<AviameterConfig> = z.object({
                departureAirport: z.string().optional(),
                arrivalAirport: z.string().optional(),
                referenceTrack: z.object({
                    name: z.string(),
                    flightPath: z.object({
                        trackPoints: z.array(
                            z.object({
                                lat: z.number(),
                                lon: z.number(),
                                alt: z.number(),
                                timestamp: z.number(),
                            }),
                        ),
                    }),
                }),
                mapOverlayShown: z.boolean(),
                units: z.enum(["aviation", "metric"]),
            });
            if (!configSchema.safeParse(JSON.parse(config)).success) {
                console.warn("Invalid config format, resetting to default.");
                this.setConfig(defaultConfig);
                return defaultConfig;
            }
            return JSON.parse(config);
        }
        return defaultConfig;
    }

    setConfig(config: AviameterConfig): void {
        this.checkStorage();
        console.debug("ConfigStore.setConfig", config);
        this.storage.setItem("config", JSON.stringify(config));
    }
}
