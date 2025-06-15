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

        const dateStr = new Date().toISOString();
        const formattedDate = dateStr.replace(/[-:]/g, "").slice(0, 13) + "Z"; // YYYYMMDD + "T" + HHMM + "Z"

        // Download the file
        const a = document.createElement("a");
        a.href = url;
        a.download = `flightPath_${formattedDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}
