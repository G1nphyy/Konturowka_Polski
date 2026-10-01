// Krok 3: tlo aplikacji = mapa kartkowkowa (data/mapa-kartkowka.jpg).
// Zamienia obrazek na data-URI (build/map_image.txt), ktory render.js wkleja
// do index.html - dzieki temu dist/index.html to jeden samodzielny plik.
// Dawna, wygenerowana "mapa fizyczna" (kolorowa rzezba, siatka, rzeki/jeziora
// rysowane kodem) zostala usunieta - rzeki i jeziora sa juz na samej mapie.
const fs = require('fs');
const { loadGeoref } = require('./projection');

const geo = loadGeoref();
const imgPath = geo.image || 'data/mapa-kartkowka.jpg';
if (!fs.existsSync(imgPath)) {
  console.error('BRAK PLIKU MAPY: ' + imgPath + '\nSkopiuj mapa-kartkowka.jpg do folderu data/ i uruchom npm run build ponownie.');
  process.exit(1);
}
const buf = fs.readFileSync(imgPath);

function jpegSize(b) {
  if (b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xFF) { i++; continue; }
    if (m === 0x01 || (m >= 0xD0 && m <= 0xD9)) { i += 2; continue; }
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

const size = jpegSize(buf);
const W = geo.origWidth * geo.scale, H = geo.origHeight * geo.scale;
if (!size) {
  console.error('Plik ' + imgPath + ' nie wyglada na poprawny JPEG.');
  process.exit(1);
}
if (size.w !== W || size.h !== H) {
  console.error('Zly rozmiar mapy: ' + size.w + 'x' + size.h + ' px, a georeferencja zaklada ' + W + 'x' + H + ' px.\n' +
    'Uzyj pliku mapa-kartkowka.jpg dostarczonego razem z projektem (albo zaktualizuj data/mapa-georef.json).');
  process.exit(1);
}

fs.writeFileSync('build/map_image.txt', 'data:image/jpeg;base64,' + buf.toString('base64'));
console.log('Map image embedded: ' + size.w + 'x' + size.h + ' px, ' + Math.round(buf.length / 1024) + ' KB');
