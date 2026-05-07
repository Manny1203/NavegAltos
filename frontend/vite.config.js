import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: [], // No precache static files
        navigateFallback: null, // No fallback HTML
        runtimeCaching: [
          {
            urlPattern: /.*/i,
            handler: 'NetworkOnly',
          }
        ]
      },
      manifest: {
        name: 'NavegAltos',
        short_name: 'NavegAltos',
        description: 'Mapa del campus universitario',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'app-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'app-icon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
