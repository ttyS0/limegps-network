# gps-simulator + limegps-network

The project requires either LimeSDR-Mini or LimeSDR-USB to work.

It consists of two parts: `gps-simulator` & `limegps-network`.

`gps-simulator` offers a friendly interactive UI and a backend to communicate with `limegps-network`, an enhanced version of `limegps` supporting server listening.



Mechanism:

[`gps-simulator` frontend] ----> [`gps-simulator` backend] ----> [`limegps-network`] ----> [LimeSDR]

## Setup

```
npm install
```

Under `limegps-network`

```
make
```

(RECOMMENDED) Visit https://cddis.nasa.gov/archive/gnss/data/daily/2020/brdc/ to get the latest BRDC ephemerides.

## Usage

First, under `limegps-network`, start a server with your latest ephemerides file (take `brdc3230.20n` for example), with a specified port and RF gain:

```
./LimeGPS -e brdc3230.20n -p 8084 -a 0.4
```

Under the project root, running the `gps-simulator`:

```
npm start
```

Visit http://127.0.0.1:8081 and enjoy.



Supported formats: `csv`, `kml`

Notes when importing `csv`:

Parser will only look for first 2 items in each line, and latitude should be the first:

```
latitude1,longitude1,...
latitude2,longitude2,...
```

