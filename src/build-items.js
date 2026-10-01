// Krok 2: laczy data/poland-coords.json (surowe lat/lon) z metadanymi kategorii,
// rzutuje wszystko w przestrzen mapy kartkowkowej i zapisuje build/items.json.
// Rzeki maja dodatkowo przebieg wyrysowany z samej mapy (data/rivers-traced.json,
// px oryginalnego obrazka) - dzieki temu quiz sprawdza klikniecie wzgledem rzeki
// dokladnie tak, jak jest narysowana na kartkowce. Rzeka bez sladu w tym pliku
// wraca do prostej lamanej z poland-coords.json.
const fs = require('fs');
const { loadGeoref, makeProjector, pxPerKm: calcPxPerKm } = require('./projection');

const geo = loadGeoref();
const project = makeProjector(geo);
const pxPerKm = calcPxPerKm(geo);
const W = geo.origWidth * geo.scale, H = geo.origHeight * geo.scale;

const srcPath = 'data/poland-coords.json';
const raw = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
console.log('Using source:', srcPath);

let traced = {};
try { traced = JSON.parse(fs.readFileSync('data/rivers-traced.json', 'utf8')); }
catch (e) { console.warn('Brak data/rivers-traced.json - rzeki beda uproszczonymi lamanymi.'); }

const r2 = v => Math.round(v * 100) / 100;
const pr = (lat, lon) => { const [x, y] = project(lat, lon); return [r2(x), r2(y)]; };
const fromImgPx = ([x, y]) => [r2((x + 0.5) * geo.scale), r2((y + 0.5) * geo.scale)];

// Click tolerance: a guess counts as correct within TOL_KM of the real
// target for points, lines and most regions. "Gory" (mountain ranges) is
// the one category kept at its actual real-world extent (radius_km) --
// those ranges are large, elongated areas, not a single spot.
// (W aplikacji mozna wybrac "luzna" dokladnosc: wtedy krainy licza sie
// w calym swoim obszarze - do tego sluzy pole radiusPx.)
const TOL_KM = 10;
const AREA_BASED_CATS = new Set(['mountains']);

const CATS = {
  extreme_points: { label: 'Punkty krańcowe', kind: 'point' },
  peaks:          { label: 'Szczyty gór wysokich', kind: 'point' },
  lowland_hills:  { label: 'Wyniesienia Niżu Polskiego', kind: 'point' },
  mountains:      { label: 'Góry', kind: 'region' },
  foothills:      { label: 'Przedgórza i Pogórza', kind: 'region' },
  uplands:        { label: 'Wyżyny', kind: 'region' },
  basins_plains:  { label: 'Kotliny i Równiny', kind: 'region' },
  lowlands:       { label: 'Niziny', kind: 'region' },
  lake_districts: { label: 'Pojezierza', kind: 'region' },
  other_regions:  { label: 'Inne krainy fizycznogeograficzne', kind: 'region' },
  rivers:         { label: 'Rzeki', kind: 'river' },
  lakes:          { label: 'Jeziora', kind: 'point' },
};

const items = [];
const skipped = [];
const outside = [];
const MARGIN = 6;
const inside = (x, y) => x >= -MARGIN && y >= -MARGIN && x <= W + MARGIN && y <= H + MARGIN;

for (const [catKey, meta] of Object.entries(CATS)) {
  const arr = raw[catKey] || [];
  for (const it of arr) {
    if (meta.kind === 'river') {
      let pxPoints;
      if (traced[it.id] && traced[it.id].px && traced[it.id].px.length >= 2) {
        pxPoints = traced[it.id].px.map(fromImgPx);
      } else if (it.points && it.points.length >= 2) {
        console.warn('Rzeka bez sladu z mapy (lamana z coords):', it.id);
        pxPoints = it.points.map(([lat, lon]) => pr(lat, lon));
      } else { skipped.push(it.id); continue; }
      if (pxPoints.some(([x, y]) => !inside(x, y))) outside.push(it.id);
      items.push({
        id: it.id, name: it.name, cat: catKey, catLabel: meta.label, kind: 'river',
        pxPoints, tolPx: Math.round(TOL_KM * pxPerKm),
      });
    } else if (meta.kind === 'region') {
      if (it.lat == null || it.lon == null) { skipped.push(it.id); continue; }
      const [x, y] = pr(it.lat, it.lon);
      if (!inside(x, y)) outside.push(it.id);
      const radiusKm = it.radius_km || 25;
      const tolKm = AREA_BASED_CATS.has(catKey) ? radiusKm : TOL_KM;
      items.push({
        id: it.id, name: it.name, cat: catKey, catLabel: meta.label, kind: 'region',
        x, y, tolPx: Math.round(tolKm * pxPerKm), radiusKm, radiusPx: Math.round(radiusKm * pxPerKm),
      });
    } else {
      if (it.lat == null || it.lon == null) { skipped.push(it.id); continue; }
      const [x, y] = pr(it.lat, it.lon);
      if (!inside(x, y)) outside.push(it.id);
      items.push({
        id: it.id, name: it.name, cat: catKey, catLabel: meta.label, kind: 'point',
        x, y, tolPx: Math.round(TOL_KM * pxPerKm),
      });
    }
  }
}

fs.writeFileSync('build/items.json', JSON.stringify(items));
console.log('Total items:', items.length);
console.log('Skipped (missing coords):', skipped);
if (outside.length) console.warn('UWAGA: obiekty poza obrazkiem mapy:', outside);
const byCat = {};
items.forEach(i => byCat[i.cat] = (byCat[i.cat] || 0) + 1);
console.log(byCat);
console.log('pxPerKm', pxPerKm);
