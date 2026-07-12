# LOOP — habits, finances, workouts & study, in one place

A single-page dashboard for tracking daily habits, debt payoff + treat-budget spending,
workout sessions, and your study/exam/certification timeline. Dark, glassy, a little bit
3D — built with React + Vite, no backend required.

Your data is saved to **your browser's local storage** on whatever device you open it on.
It does not sync between devices and does not leave your machine — nothing is sent to a server.

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview   # to test the production build locally
```

This outputs a static site to `dist/` — plain HTML/CSS/JS, deployable anywhere.

## Deploy it for free

The easiest options, since this is a static site with no backend:

- **Vercel**: `npx vercel` in this folder (or connect the repo on vercel.com) — auto-detects Vite.
- **Netlify**: drag-and-drop the `dist/` folder onto netlify.com/drop, or connect the repo.
- **GitHub Pages**: build, then push `dist/` to a `gh-pages` branch (or use the `gh-pages` npm package).

## Project structure

```
src/
  App.jsx       — the whole app: all 5 sections, components, and logic
  main.jsx      — mounts the app
  style.css     — all styling (dark cosmic theme, glass cards, 3D tilt hover)
index.html      — loads the Google Fonts used (Space Grotesk / Inter / JetBrains Mono)
```

`App.jsx` is intentionally one file for now — it's organized top-to-bottom (storage → date
utils → constants → small components → the 5 sections → the root `App`), so splitting each
section into its own file later is mostly copy-paste if the file starts feeling big.

## Editing your data

The Study & Exams section is seeded with the specific deadlines from your current term
(internals, externals, the 3 certifications, research/project, placement goal). Edit or
delete any of them — and add new ones — right from the Study tab; nothing is hardcoded
beyond that first seed.

## Notes

- Everything is client-side. If you clear your browser's site data for this app, your
  logged history clears too — there's no cloud backup built in. Worth keeping the Excel
  version as an occasional backup if that matters to you.
- Swap the `store` object at the top of `App.jsx` for a real backend (e.g. calls to your
  own API) later if you want this synced across devices — the rest of the app only ever
  calls `store.get(key)` / `store.set(key, value)`, so that's the one place to change.
