# Math Trainer

A progressive web app (PWA) for practicing mental arithmetic. Designed for kids in grades 1–4, with 55 task types, 8 languages, and detailed statistics.

## Features

- 55 task types — addition, subtraction, multiplication, division across different digit ranges
- 8 languages — Russian, English, Spanish, French, German, Italian, Portuguese, Ukrainian
- Statistics — daily contribution graph, streak tracking, hourly activity, per-test breakdown
- Parent panel — PIN-protected settings to enable/disable tasks, adjust rounds count, toggle sound, reset stats
- PWA — installable on iPad/phone home screen, works offline
- Sound effects, custom numpad, shake/spring animations

## Screenshots

<img src="screenshots/img01.png" width="200" /> <img src="screenshots/img02.png" width="200" /> <img src="screenshots/img03.png" width="200" /> <img src="screenshots/img04.png" width="200" />
<img src="screenshots/img05.png" width="200" /> <img src="screenshots/img06.png" width="200" /> <img src="screenshots/img07.png" width="200" /> <img src="screenshots/img08.png" width="200" />

## Tech Stack

React 19 + TypeScript, Vite 6 + vite-plugin-pwa, react-router-dom (HashRouter), localStorage, pure CSS.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173.

### Build

```bash
npm run build
```

Output in `dist/` — deployable to any static host (Netlify, Vercel, GitHub Pages, etc.).

## PIN

Set on first Settings entry. If forgotten, clear site data via DevTools (`F12` → Application → Local Storage → delete keys `matemagic_*`).
