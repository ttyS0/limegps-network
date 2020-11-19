import { getDistance } from 'geolib';

function ratioPoint(point1, point2, ratio) {
    return {
        longitude: (1 - ratio) * point1.longitude + ratio * point2.longitude,
        latitude: (1 - ratio) * point1.latitude + ratio * point2.latitude
    };
}

export function sampleBySpeed(route, speed, tickUnit = 1) {
    let samples = [], tick = 0;
    const segUnit = speed * tickUnit;
    for(let i = 1; i < route.length; i++) {
        const segDistance = getDistance(route[i - 1], route[i]);
        if(segDistance < segUnit) {
            samples.push({
                ...route[i],
                tick: tick.toFixed(1)
            });
            tick += tickUnit;
        } else {
            const segLength = Math.round(segDistance / segUnit);
            for(let n = 1; n <= segLength; n++)
            {
                samples.push({
                    ...ratioPoint(route[i - 1], route[i], n / segLength),
                    tick: tick.toFixed(1)
                });
                tick += tickUnit;
            }
        }
    }
    return samples;
}