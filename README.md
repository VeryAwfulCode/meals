# Meals

Meal-scheduling PWA. Vite + React + TypeScript, deployed to GitHub Pages.

## Setup

```sh
npm install
npm run dev
```

Open `http://localhost:5173/meals/` — note the `/meals/` base path (matches the GitHub Pages sub-path).

## Build

```sh
npm run build
npm run preview
```

## Deploy

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds and publishes `dist/` to GitHub Pages.

Before your first push, on GitHub:

1. Repo → *Settings* → *Pages* → *Source*: **GitHub Actions**
2. If the repo name isn't `meals`, edit `REPO` in `vite.config.ts` — everything else (scope, start_url, base path) derives from it.

## Structure

```
src/
  main.tsx          entry
  App.tsx           app root — rewrite this
  index.css         base styles
  App.css           App styles
  vite-env.d.ts     Vite + vite-plugin-pwa types
public/
  icon.svg          app + PWA icon
.github/workflows/
  deploy.yml        build + publish to Pages
vite.config.ts      Vite + vite-plugin-pwa (base path, manifest, SW)
```

## License

MIT — see [LICENSE](LICENSE).
