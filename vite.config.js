import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// The PWA plugin makes the site installable ("Install app" in Chrome,
// "Add to Dock" in Safari) so it can live in its own small window.
export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Purrmodoro',
        short_name: 'Purrmodoro',
        description: 'A very cute pomodoro timer with a cat who cheers you on.',
        theme_color: '#ffb5c8',
        background_color: '#fff6ee',
        display: 'standalone',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
