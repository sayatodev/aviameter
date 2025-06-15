export default class FlightPathStore {
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

    getFlightPath(): FlightPath {
        this.checkStorage();
        const flightPath = this.storage.getItem("flightPath");
        if (flightPath) {
            return JSON.parse(flightPath);
        }
        return { trackPoints: [] };
    }

    addTrackPoint(point: TrackPoint): void {
        this.checkStorage();
        const flightPath = this.getFlightPath();
        flightPath.trackPoints.push(point);
        this.storage.setItem("flightPath", JSON.stringify(flightPath));
    }

    clearFlightPath(): void {
        this.checkStorage();
        this.storage.removeItem("flightPath");
    }

    exportJSON(): void {
        this.checkStorage();
        const flightPath =
            this.storage.getItem("flightPath") ?? "{ trackPoints: [] }";

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
