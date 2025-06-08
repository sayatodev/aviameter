export default class FlightPathStore {
    storage?: Storage;

    constructor() {}

    setStorage(storage: Storage): void {
        this.storage = storage;
    }

    getFlightPath(): FlightPath {
        if (!this.storage) {
            throw new Error("Storage not set. Call setStorage() first.");
        }
        const flightPath = this.storage.getItem("flightPath");
        if (flightPath) {
            return JSON.parse(flightPath);
        }
        return { trackPoints: [] };
    }

    addTrackPoint(point: TrackPoint): void {
        if (!this.storage) {
            throw new Error("Storage not set. Call setStorage() first.");
        }
        const flightPath = this.getFlightPath();
        flightPath.trackPoints.push(point);
        this.storage.setItem("flightPath", JSON.stringify(flightPath));
    }

    clearFlightPath(): void {
        if (!this.storage) {
            throw new Error("Storage not set. Call setStorage() first.");
        }
        this.storage.removeItem("flightPath");
    }

    exportJSON(): void {
        let flightPath = window.localStorage.getItem("flightPath");
        if (!flightPath) {
            flightPath = JSON.stringify({ trackPoints: [] });
        }

        const blob = new Blob([flightPath], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
    }
}
