export class KMLParser {
    getPositions(kmlString: string): TrackPoint[] {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(kmlString, "application/xml");

        const track = xmlDoc.getElementsByTagName("gx:Track")[0];
        if (!track) {
            throw new Error("No gx:Track found in KML");
        }

        const timestamps = track.getElementsByTagName("when");
        const coordinates = track.getElementsByTagName("gx:coord");

        if (timestamps.length === 0 || coordinates.length === 0) {
            throw new Error("No timestamps or coordinates found in gx:Track");
        }

        const positions: TrackPoint[] = [];

        for (let i = 0; i < coordinates.length; i++) {
            const coord = coordinates[i].textContent?.trim().split(" ");
            if (coord && coord.length === 3) {
                const lat = parseFloat(coord[1]);
                const lon = parseFloat(coord[0]);
                const alt = parseFloat(coord[2]);
                const timestamp = timestamps[i]
                    ? new Date(timestamps[i].textContent ?? "").getTime()
                    : 0;

                positions.push({ lat, lon, alt, timestamp });
            }
        }

        if (positions.length === 0) {
            throw new Error("No valid coordinates found in gx:Track");
        }

        console.log("Parsed positions:", positions);
        return positions;
    }

    static processFile(file: File): Promise<TrackPoint[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const kmlString = event.target?.result as string;
                    const parser = new KMLParser();
                    const positions = parser.getPositions(kmlString);
                    resolve(positions);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }
}

