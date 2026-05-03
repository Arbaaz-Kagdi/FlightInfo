require('@babel/register')({ presets: ['@babel/preset-react'] });
const React = require('react');
const ReactDOMServer = require('react-dom/server');

require.extensions['.css'] = () => {};
const lucide = new Proxy({}, { get: (t, p) => p === '__esModule' ? false : () => React.createElement('svg', { name: p }) });
require.cache[require.resolve('lucide-react')] = { exports: lucide };

const FlightDetails = require('./src/components/FlightDetails.jsx').default;
const payload = {
  "flight_date": "2026-04-26",
  "flight_status": "scheduled",
  "departure": {
    "airport": "Dallas/Fort Worth International",
    "timezone": "America/Chicago",
    "iata": "DFW",
    "icao": "KDFW",
    "terminal": "D",
    "gate": "D33",
    "delay": null,
    "scheduled": "2026-04-26T11:05:00+00:00",
    "estimated": "2026-04-26T11:05:00+00:00",
    "actual": null,
    "estimated_runway": null,
    "actual_runway": null
  },
  "arrival": {
    "airport": "Kahului",
    "timezone": "Pacific/Honolulu",
    "iata": "OGG",
    "icao": "PHOG",
    "terminal": null,
    "gate": "35",
    "baggage": null,
    "scheduled": "2026-04-26T14:01:00+00:00",
    "delay": null,
    "estimated": null,
    "actual": null,
    "estimated_runway": null,
    "actual_runway": null
  },
  "airline": {
    "name": "American Airlines",
    "iata": "AA",
    "icao": "AAL"
  },
  "flight": {
    "number": "123",
    "iata": "AA123",
    "icao": "AAL123",
    "codeshared": null
  },
  "aircraft": {
    "registration": null,
    "iata": null,
    "icao": null,
    "icao24": "AB5FC9"
  },
  "live": null
};

try {
  ReactDOMServer.renderToString(React.createElement(FlightDetails, { flight: payload }));
  console.log('RENDER SUCCESS');
} catch (err) {
  console.error('RENDER ERROR:', err);
}
