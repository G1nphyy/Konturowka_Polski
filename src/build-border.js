// Krok 1: konfiguracja projekcji z data/mapa-georef.json.
// (Plik nazywa sie build-border.js z historycznych powodow - kiedys rysowal
// granice z GeoJSON, teraz granice rysuje juz sama mapa kartkowkowa.)
// Granica z data/poland-border.geo.json sluzy tylko do kontroli: sprawdzamy,
// czy po rzutowaniu miesci sie w obrazku mapy.
const fs = require('fs');
const { loadGeoref, makeProjector, pxPerKm } = require('./projection');
fs.mkdirSync('build', { recursive: true });

const geo = loadGeoref();
const W = geo.origWidth * geo.scale;
const H = geo.origHeight * geo.scale;
const project = makeProjector(geo);

const config = { width: W, height: H, scale: geo.scale, pxPerKm: pxPerKm(geo) };
fs.writeFileSync('build/projection_config.json', JSON.stringify(config, null, 2));

try {
  const ring = JSON.parse(fs.readFileSync('data/poland-border.geo.json', 'utf8')).features[0].geometry.coordinates[0];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [lon, lat] of ring) {
    const [x, y] = project(lat, lon);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  console.log('Granica Polski w px mapy: x ' + Math.round(minX) + '..' + Math.round(maxX) + ', y ' + Math.round(minY) + '..' + Math.round(maxY));
  if (minX < 0 || minY < 0 || maxX > W || maxY > H) {
    console.warn('UWAGA: granica Polski wychodzi poza obrazek mapy - sprawdz data/mapa-georef.json');
  }
} catch (e) {
  console.warn('Pominieto kontrole granicy:', e.message);
}
console.log('Mapa: ' + W + 'x' + H + ' px, ' + config.pxPerKm.toFixed(3) + ' px/km');
