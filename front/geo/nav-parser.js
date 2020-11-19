import { readFileAsync } from '../utils';

function csvToNavigation(csv) {
    return csv.split("\n").map(l => {
        const segs = l.split(',').map(v => v.trim());
        return {
            latitude: segs[0],
            longitude: segs[1]
        }
    });
}

function kmlToNavigation(kml) {
    const coordinates = kml.match(/<coordinates>([\S\s]*?)<\/coordinates>/)[1].trim().split(' ');
    return coordinates.map(l => {
        const segs = l.split(',').map(v => v.trim());
        return {
            latitude: segs[1],
            longitude: segs[0]
        }
    })
}

function gpxToNavigation(gpx) {
    gpx;
    // TO-DO: GPX TO NAVIGATION
}


export async function parseNavigationFile(file) {
    try {
        const content = await readFileAsync(file);
        switch(file.type) {
            case 'text/csv':
                return csvToNavigation(content);
            case 'application/json':
                return JSON.parse(content);
            case 'application/vnd.google-earth.kml+xml':
                return kmlToNavigation(content);
            case 'application/gpx+xml':
                return gpxToNavigation(content);
            default:
                throw new Error('Unsupported navigation file.');
        }
    } catch(e) {
        throw new Error(`Error when parsing navigation file: ${e.message}`);
    }
}