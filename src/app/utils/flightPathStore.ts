export default class FlightPathStore {
    storage: Storage;

    constructor(storage: Storage) {
        this.storage = storage;
    }

    getFlightPath(): FlightPath {
        const flightPath = this.storage.getItem("flightPath");
        if (flightPath) {
            return JSON.parse(flightPath);
        }
        return { trackPoints: [] };
    }

    addTrackPoint(point: TrackPoint): void {
        const flightPath = this.getFlightPath();
        flightPath.trackPoints.push(point);
        this.storage.setItem("flightPath", JSON.stringify(flightPath));
    }

    clearFlightPath(): void {
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
