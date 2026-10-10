import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: { port: 5173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:4173' } },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'AgriPulse Limpopo',
        short_name: 'AgriPulse',
        description: 'Offline Agricultural Field Utilities for Limpopo Smallholders',
        theme_color: '#166534',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,

      }
    })
  ]
})
