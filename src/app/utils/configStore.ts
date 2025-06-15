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
        console.debug("ConfigStore.getConfig", config);
        if (config) {
            return JSON.parse(config);
        }
        return {
            departureAirport: "",
            arrivalAirport: "",
            trackPoints: [],
            mapOverlayShown: false,
        };
    }

    setConfig(config: AviameterConfig): void {
        this.checkStorage();
        console.debug("ConfigStore.setConfig", config);
        this.storage.setItem("config", JSON.stringify(config));
    }
}
