// Krok 4: sklada src/app.template.html + dane -> dist/index.html
// (oraz kopie w Konturowka-Polski/index.html - paczka do wyslania komus / otwarcia dwuklikiem).
const fs = require('fs');
fs.mkdirSync('dist', { recursive: true });
const tpl = fs.readFileSync('src/app.template.html', 'utf8');
const cfg = JSON.parse(fs.readFileSync('build/projection_config.json', 'utf8'));
const items = fs.readFileSync('build/items.json', 'utf8');
const mapImage = fs.readFileSync('build/map_image.txt', 'utf8').trim();

let out = tpl
  .split('__VIEWBOX_W__').join(cfg.width)
  .split('__VIEWBOX_H__').join(cfg.height)
  .split('__ITEMS_JSON__').join(items)
  .split('__PX_PER_KM__').join(cfg.pxPerKm.toFixed(6))
  .split('__MAP_DATA_URI__').join(mapImage);

const left = out.match(/__[A-Z_]+__/g);
if (left) {
  console.error('Niepodmienione znaczniki w szablonie:', Array.from(new Set(left)));
  process.exit(1);
}

fs.writeFileSync('dist/index.html', out);
console.log('Wrote dist/index.html, size:', out.length, 'bytes');

fs.mkdirSync('Konturowka-Polski', { recursive: true });
fs.writeFileSync('Konturowka-Polski/index.html', out);
console.log('Wrote Konturowka-Polski/index.html (kopia do dystrybucji)');
