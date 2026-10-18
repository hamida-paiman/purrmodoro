# 🐱 Purrmodoro

A very cute pomodoro timer. Add your own focus and break sessions, and a little cat hops along while you work, naps during breaks, and throws a confetti party when you finish.

- Make your own session list (or quick-fill 25/5, 50/10, 15/3)
- The cat reacts: hops while you focus, naps on breaks, celebrates when you finish (click it for pets 💕)
- **Mini window** (🪟 button): a tiny always-on-top window for the corner of your screen (Chrome / Edge)
- Installable as an app, dark mode, 5 kitty coats, daily stats and streaks
- Everything is saved in your own browser. There are no accounts and no personal data.

## Run it locally

```bash
npm install      # download the packages listed in package.json
npm run dev      # start the dev server → http://localhost:5173 (auto-reloads on save)
npm run build    # make the production version in dist/
npm run preview  # serve dist/ locally to test the production version
npm run icons    # regenerate the app icons from public/favicon.svg
```

## How the project is organized

```
index.html            page structure (Vite starts here)
vite.config.js        Vite + PWA plugin settings (app name, colors, icons)
public/               files copied as-is: favicon + app icons
src/
  main.js             connects everything: buttons, rendering, timer events
  timer.js            countdown that stores the end time, so it never drifts
  tick-worker.js      Web Worker so the timer keeps ticking in background tabs
  sessions.js         session list, settings & stats saved in localStorage
  cat.js              the cat SVG + its moods (working, napping, celebrating)
  celebrate.js        confetti 🎉
  sound.js            chimes and mews made with Web Audio (no audio files)
  miniWindow.js       always-on-top mini window (Document Picture-in-Picture)
  analytics.js        anonymous visitor counting with GoatCounter
  styles/main.css     colors, layout, squishy buttons, dark mode
  styles/cat.css      cat colors and all the animations
```

## Deploy (free) on Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, click **Add New → Project**, and import the repo.
3. Vercel detects Vite automatically (build: `npm run build`, output: `dist`). Click **Deploy**.
4. From then on, every `git push` to `main` redeploys automatically.

## Counting users (anonymously)

1. Sign up at [goatcounter.com](https://www.goatcounter.com) and pick a code (e.g. `purrmodoro`).
2. Put that code in `GOATCOUNTER_CODE` in `src/analytics.js`, commit, and push.
3. Your dashboard at `https://<code>.goatcounter.com` shows visitors, plus `focus-session-completed` events.
   No cookies and no personal info are collected.

## Use it as a tiny corner window

- **Chrome / Edge:** click 🪟 for a floating mini window that stays on top of everything.
  You can also install the app (the install icon in the address bar) and shrink its window.
- **Safari:** File → Add to Dock, then make the window small. The layout adapts down to about 300×400.
