export function calculateMeanSpeed(positions: GeolocationPosition[]): number {
    if (!positions || positions.length < 2) {
        return 0;
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
            const speed = distance / timeDiff;
            speeds.push(speed);
        } else {
            speeds.push(0);
        }
    }

    // Calculate mean speed
    if (speeds.length === 0) {
        return 0;
    }
    const totalSpeed = speeds.reduce((sum, speed) => sum + speed, 0);
    return (totalSpeed / speeds.length) * 1.94384; // m/s to kts
}

export function calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
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

    return R * c; // Distance in meters
}

export function calculateMeanVertSpeed(
    positions: GeolocationPosition[],
): number {
    if (!positions || positions.length < 2) {
        return 0;
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
        return 0;
    }
    const totalSpeed = vertSpeeds.reduce((sum, speed) => sum + speed, 0);
    return (totalSpeed / vertSpeeds.length) * 196.850394; // m/s to fpm
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
    distances.sort((a, b) => a.distance - b.distance);

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

function getDistance(point1: TrackPoint, point2: TrackPoint): number {
    return calculateHaversineDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon,
    );
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
    const endPoint = midTrack[midTrack.length - 1];
    const refStartPoint = getNearestPoint(midRefTrack, startPoint);
    const refEndPoint = getNearestPoint(midRefTrack, endPoint);
    if (!refStartPoint || !refEndPoint) {
        console.warn("Could not find reference points for estimation");
        return null;
    }

    const refEndPointIndex = midRefTrack.indexOf(refEndPoint);
    const refLandPoint = referenceTrack[referenceTrack.length - 1];

    // Calculating progress between two nearest reference points (Call it "current segment")
    const refEndPrevPoint = midRefTrack[refEndPointIndex - 1];
    const refEndNextPoint = midRefTrack[refEndPointIndex + 1];
    if (!refEndPrevPoint || !refEndNextPoint) {
        console.warn("Reference end point has no previous or next point");
        return null;
    }

    let currentSegmentRemainingTime: 0;
    const distToPrev = getDistance(refEndPrevPoint, endPoint);
    const distToEnd = getDistance(refEndPoint, endPoint);
    const distToNext = getDistance(refEndNextPoint, endPoint);
    if (distToPrev < distToNext) {
        /* Status: DEP -- [REF_END_PREV] -- [CURRENT] -- [REF_END] --> ARR */
        const segmentTime = refEndPoint.timestamp - refEndPrevPoint.timestamp;
        currentSegmentRemainingTime =
            (distToEnd / (distToPrev + distToEnd)) * segmentTime;
    } else {
        /* Status: DEP -- [REF_END] -- [CURRENT] -- [REF_END_NEXT] --> ARR */
        const segmentTime = refEndNextPoint.timestamp - refEndPoint.timestamp;
        currentSegmentRemainingTime =
            (distToNext / (distToEnd + distToNext)) * segmentTime;
    }

    // Main estimation
    const actualTime = endPoint.timestamp - startPoint.timestamp;
    const refTime = refEndPoint.timestamp - refStartPoint.timestamp;
    const factor = actualTime / refTime;

    const refRemainingTime = refLandPoint.timestamp - refEndPoint.timestamp;
    const estimatedTime = new Date(
        endPoint.timestamp +
            (refRemainingTime + currentSegmentRemainingTime) * factor,
    );

    if (isNaN(estimatedTime.getTime())) {
        console.warn("Estimated time is invalid");
        return null;
    }
    // if (estimatedTime < new Date()) {
    //     console.warn("Estimated time is in the past");
    //     return null;
    // }

    console.log(
        `Estimated time of arrival: ${estimatedTime.toISOString()} (factor: ${factor})`,
    );
    return estimatedTime;
}
