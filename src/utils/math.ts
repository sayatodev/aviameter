import { Length, Speed } from "./units";

export function calculateMeanSpeed(positions: GeolocationPosition[]): Speed {
    if (!positions || positions.length < 2) {
        return new Speed(0);
    }

    const speeds: number[] = [];

    // Calculate speeds between consecutive positions
    for (let i = 1; i < positions.length; i++) {
        const prevPos = positions[i - 1];
        const currPos = positions[i];

        // Calculate distance between points using Haversine formula
        const distance = calculateHaversineDistance(
            prevPos.coords.latitude,
            prevPos.coords.longitude,
            currPos.coords.latitude,
            currPos.coords.longitude,
        );

        // Calculate time difference in seconds
        const timeDiff = (currPos.timestamp - prevPos.timestamp) / 1000;

        if (timeDiff > 0) {
            // Speed in meters per second
            const speed = distance.value / timeDiff;
            speeds.push(speed);
        } else {
            speeds.push(0);
        }
    }

    // Calculate mean speed
    if (speeds.length === 0) {
        return new Speed(0);
    }
    const totalSpeed = speeds.reduce((sum, speed) => sum + speed, 0);
    return new Speed(totalSpeed / speeds.length);
}

export function calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): Length {
    const R = 6371000; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) *
            Math.cos(phi2) *
            Math.sin(deltaLambda / 2) *
            Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return new Length(R * c);
}

export function calculateMeanVertSpeed(
    positions: GeolocationPosition[],
): Speed {
    if (!positions || positions.length < 2) {
        return new Speed(0);
    }

    const vertSpeeds: number[] = [];

    for (let i = 1; i < positions.length; i++) {
        const prevPos = positions[i - 1];
        const currPos = positions[i];

        if (!currPos.coords.altitude || !prevPos.coords.altitude) {
            vertSpeeds.push(0);
            continue;
        }
        const altDiff = currPos.coords.altitude - prevPos.coords.altitude;

        // Calculate time difference in seconds
        const timeDiff = (currPos.timestamp - prevPos.timestamp) / 1000;

        if (timeDiff > 0) {
            // v/s in meters per second
            const vertSpeed = altDiff / timeDiff;
            vertSpeeds.push(vertSpeed);
        }
    }

    // Calculate mean v/s
    if (vertSpeeds.length === 0) {
        return new Speed(0);
    }
    const totalSpeed = vertSpeeds.reduce((sum, speed) => sum + speed, 0);
    return new Speed(totalSpeed / vertSpeeds.length);
}

function getNearestPoint(
    track: TrackPoint[],
    from: TrackPoint,
    result_offset: number = 0,
): TrackPoint | null {
    if (track.length === 0) {
        console.warn("Track is empty");
        return null;
    }

    const distances = track.map((point) => {
        const distance = calculateHaversineDistance(
            from.lat,
            from.lon,
            point.lat,
            point.lon,
        );
        return { point, distance };
    });
    distances.sort((a, b) => a.distance.value - b.distance.value);

    if (distances.length <= result_offset) {
        console.warn("No points found after offset");
        return null;
    }

    const nearestPoint = distances[result_offset].point;
    if (!nearestPoint) {
        console.warn("Nearest point is undefined");
        return null;
    }

    return nearestPoint;
}

function getDistance(point1: Point, point2: Point): Length {
    return calculateHaversineDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon,
    );
}

function projectPointOnSegment(
    point: TrackPoint,
    segmentStart: TrackPoint,
    segmentEnd: TrackPoint,
): { lat: number; lon: number } {
    const dx = segmentEnd.lon - segmentStart.lon;
    const dy = segmentEnd.lat - segmentStart.lat;

    const t =
        ((point.lon - segmentStart.lon) * dx +
            (point.lat - segmentStart.lat) * dy) /
        (dx * dx + dy * dy);

    if (t < 0) {
        return segmentStart; // Before the start of the segment
    } else if (t > 1) {
        return segmentEnd; // After the end of the segment
    }

    return {
        lat: segmentStart.lat + t * dy,
        lon: segmentStart.lon + t * dx,
    };
}

export function estimateTimeOfArrival(
    track: TrackPoint[],
    referenceTrack: TrackPoint[],
): Date | null {
    if (track.length === 0 || referenceTrack.length === 0) {
        console.warn("Track or reference track is empty");
        return null;
    }

    const midTrack = track.filter((point) => point.alt > 1500);
    const midRefTrack = referenceTrack.filter((point) => point.alt > 1500);

    if (midTrack.length === 0 || midRefTrack.length === 0) {
        console.warn("No valid track or reference track points in the sky");
        return null;
    }

    const startPoint = midTrack[0];
    const currentPoint = midTrack[midTrack.length - 1];
    const refStartPoint = getNearestPoint(midRefTrack, startPoint);
    const refClosestPoint = getNearestPoint(midRefTrack, currentPoint);
    if (!refStartPoint || !refClosestPoint) {
        console.warn("Could not find reference points for estimation");
        return null;
    }

    const refClosestIndex = midRefTrack.indexOf(refClosestPoint);
    const refLandPoint = referenceTrack[referenceTrack.length - 1];

    // Getting nearest reference points
    const refPrevPoint = midRefTrack[refClosestIndex - 1];
    const refNextPoint = midRefTrack[refClosestIndex + 1];
    if (!refPrevPoint || !refNextPoint) {
        console.warn("Reference end point has no previous or next point");
        return null;
    }

    // Calculate current segment (PREV->END->NEXT)
    const projectionOnSegment = projectPointOnSegment(
        currentPoint,
        refPrevPoint,
        refNextPoint,
    );
    const segmentTimeLength = refNextPoint.timestamp - refPrevPoint.timestamp;
    const segmentDistance = getDistance(refPrevPoint, refNextPoint);

    const currentSegmentProgress =
        getDistance(projectionOnSegment, refPrevPoint).value /
        segmentDistance.value;
    const currentSegmentRemainingTimeBase =
        segmentTimeLength * (1 - currentSegmentProgress);

    // Main estimation
    const actualTimePast = currentPoint.timestamp - startPoint.timestamp;
    const estStartToPrev =
        actualTimePast - segmentTimeLength * currentSegmentProgress; // Estimated time from start to previous point, by current segment progress
    const refStartToPrev = refPrevPoint.timestamp - refStartPoint.timestamp;
    const factor = estStartToPrev / refStartToPrev;

    const remainingTimeBase =
        refLandPoint.timestamp - refClosestPoint.timestamp;
    const estimatedTime = new Date(
        currentPoint.timestamp +
            (remainingTimeBase + currentSegmentRemainingTimeBase) * factor,
    );

    // console.debug(
    //     `estStartToPrev: ${estStartToPrev} seconds\n`,
    //     `refStartToPrev: ${refStartToPrev} seconds\n`,
    //     `Reference start point: ${refStartPoint.lat}, ${refStartPoint.lon}\n`,
    //     `Reference previous point: ${refPrevPoint.lat}, ${refPrevPoint.lon}\n`,
    //     `Reference closest point: ${refClosestPoint.lat}, ${refClosestPoint.lon}\n`,
    //     `Reference next point: ${refNextPoint.lat}, ${refNextPoint.lon}\n`,
    //     `Current point: ${currentPoint.lat}, ${currentPoint.lon}\n`,
    //     `Reference end point: ${refLandPoint.lat}, ${refLandPoint.lon}\n`,
    //     `Factor: ${factor}\n`,
    //     `Current segment: ${Math.floor((currentSegmentRemainingTimeBase * factor) / 1000)} more seconds\n`,
    //     `Main component: ${Math.floor((remainingTimeBase * factor) / 1000)} more seconds\n`,
    // );

    if (isNaN(estimatedTime.getTime())) {
        console.warn("Estimated time is invalid");
        return null;
    }

    // console.debug(`ETA: ${estimatedTime.toISOString()}\n`);

    return estimatedTime;
}
