import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
  base: './',
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icon.svg', 'apple-touch-icon.png'],
    manifest: {
      name: 'Hisaab', short_name: 'Hisaab', description: 'Private personal and business finance tracker that works offline.',
      start_url: '.', scope: '.', display: 'standalone', orientation: 'portrait',
      background_color: '#f7f3ea', theme_color: '#12503f',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico}'], navigateFallback: 'index.html', cleanupOutdatedCaches: true }
  })]
})
