// Wspolna projekcja (lat/lon -> px w przestrzeni SVG aplikacji).
// Parametry pochodza z data/mapa-georef.json: projekcja stozkowa dopasowana
// do mapy kartkowkowej (data/mapa-kartkowka.jpg). Uzywaja jej build-border.js
// i build-items.js, wiec granica, obiekty i mapa zawsze sa w tym samym ukladzie.
const fs = require('fs');

const R_KM = 6371;
const rad = d => d * Math.PI / 180;

function loadGeoref() {
  return JSON.parse(fs.readFileSync('data/mapa-georef.json', 'utf8'));
}

function makeProjector(geo) {
  const p = geo.projection;
  const n = Math.sin(rad(p.phi1));
  const K = 1 / Math.tan(rad(p.phi1));
  // wynik: [x, y] w przestrzeni SVG (obrazek powiekszony geo.scale razy).
  // +0.5: srodek piksela obrazka (wspolrzedne dopasowania sa indeksami pikseli)
  return function project(lat, lon) {
    const rho = K - rad(lat - 52);
    const ang = n * rad(lon - p.lon0);
    const x = p.s * rho * Math.sin(ang) + p.tx;
    const y = p.s * rho * Math.cos(ang) + p.ty;
    return [(x + 0.5) * geo.scale, (y + 0.5) * geo.scale];
  };
}

function pxPerKm(geo) {
  return geo.projection.s * geo.scale / R_KM;
}

module.exports = { loadGeoref, makeProjector, pxPerKm, R_KM };
