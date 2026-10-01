# Konturówka fizyczna Polski

Quiz do nauki fizycznej mapy Polski przed kartkówką (styl Seterra): pokazuje nazwę
obiektu, klikasz na mapie, aplikacja liczy odległość od poprawnej lokalizacji.

Mapa w aplikacji to **dokładnie ta mapa, która będzie na kartkówce** (`data/mapa-kartkowka.jpg`),
a obiekty quizu są dopasowane do niej (georeferencja w `data/mapa-georef.json`).

Wymaga tylko Node.js (żadnych zewnętrznych paczek / `npm install`).

## Szybki start

1. Upewnij się, że plik `mapa-kartkowka.jpg` leży w folderze `data/`.
2. Uruchom:

```bash
npm run dev
```

Zbuduje aplikację i uruchomi lokalny serwer pod `http://localhost:8936`.

Albo osobno:

```bash
npm run build   # generuje dist/index.html (+ kopię Konturowka-Polski/index.html)
npm run serve   # serwuje dist/ pod localhost:8936
```

Gotowy `dist/index.html` (albo `Konturowka-Polski/index.html`) to jeden samodzielny plik z mapą w środku —
można go otworzyć dwuklikiem albo wysłać na telefon. Bez internetu zadziała tak samo,
tylko czcionki Google Fonts zastąpią zwykłe systemowe.

## Co potrafi aplikacja

- **Quiz**: pytanie → klik na mapie → od razu widać, gdzie był cel (pomarańczowy znacznik z zaznaczoną tolerancją,
  rzeki podświetlone wzdłuż przebiegu na mapie). Przycisk „Nie wiem”, pasek postępu, seria dobrych odpowiedzi.
- **Przebieg**: po dobrej odpowiedzi od razu leci następne pytanie (można wyłączyć), po złej czekasz na „Dalej”.
  Skróty: `Enter` / `→` dalej, `Esc` wyjście, `+` `−` `0` zoom.
- **Zoom i przesuwanie mapy**: kółko myszy, przyciski, szczypanie na telefonie, przeciąganie. Skala (km) dopasowuje się do zoomu.
- **Dokładność kliknięcia**: „ścisła” (ok. 10 km, jak dotąd) albo „luźna” (krainy liczą się w całym swoim obszarze).
- **Nauka**: lista obiektów z wyszukiwarką, strzałki ↑ ↓ przełączają obiekty, opcja „pokaż wszystkie etykiety”.
- **Wyniki**: podsumowanie wg kategorii, lista błędów, „Powtórz błędy”.
- **Statystyki** zapisywane lokalnie w przeglądarce (skuteczność ogółem i dla każdej kategorii).

## Struktura projektu

```
data/
  mapa-kartkowka.jpg       mapa z kartkówki (powiększona 3x, 1512x1188 px)
  mapa-georef.json         parametry projekcji: współrzędne geograficzne -> piksele mapy
  rivers-traced.json       przebieg rzek wyrysowany z mapy (px oryginalnego obrazka 504x396)
  poland-coords.json       współrzędne wszystkich obiektów quizu (edytuj tu!)
  poland-border.geo.json   granica Polski (tylko do kontroli dopasowania w buildzie)
src/
  projection.js            wspólna projekcja lat/lon -> px (czyta mapa-georef.json)
  build-border.js          konfiguracja projekcji + kontrola, czy granica mieści się w mapie
  build-items.js           poland-coords.json -> punkty/linie w px mapy + tolerancje
  build-physical.js        osadza mapa-kartkowka.jpg w aplikacji (data-URI)
  render.js                skleja src/app.template.html + dane -> dist/index.html
  app.template.html        CAŁY kod aplikacji (HTML/CSS/JS) z placeholderami __X__
  server.js                mini serwer statyczny do podglądu lokalnie
build/                     pliki pośrednie (generowane, można skasować)
dist/index.html            gotowa, samodzielna aplikacja
Konturowka-Polski/         kopia index.html do wysłania / otwarcia dwuklikiem
```

## Jak coś zmienić

- **Poprawić obiekt quizu** (np. złą lokalizację jeziora) → `data/poland-coords.json`
  (WGS84, `lat`/`lon`), potem `npm run build`.
- **Poprawić przebieg rzeki** → `data/rivers-traced.json` (punkty `[x, y]` w pikselach oryginalnego
  obrazka 504x396, czyli współrzędne mapy / 3).
- **Zmienić wygląd, teksty, logikę** → `src/app.template.html`, potem `npm run build`.
- **Zmienić tolerancję / kategorie** → `src/build-items.js` (stałe `CATS`, `TOL_KM`).
- **Podmienić mapę na inną** → nowy obrazek trzeba dopasować (nowe parametry w `data/mapa-georef.json`
  i nowy `rivers-traced.json`); sama podmiana pliku jpg nie wystarczy, bo obiekty przestaną pasować.

## Dane geograficzne

Współrzędne obiektów pochodzą z ogólnodostępnych źródeł (m.in. Wikipedia) i są dopasowane
do nauki na kartkówkę, a nie do zastosowań geodezyjnych. Dawna, wygenerowana „rzeźba terenu”
(kolorowe niziny/wyżyny/góry) została usunięta — liczy się tylko mapa z kartkówki.
