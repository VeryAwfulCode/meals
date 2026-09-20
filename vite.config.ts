import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const REPO = 'meals'
const base = `/${REPO}/`

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Meals',
        short_name: 'Meals',
        description: 'Minimalist meal-scheduling PWA',
        theme_color: '#111111',
        background_color: '#111111',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        icons: [
          { src: 'icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
          { src: 'icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
})
