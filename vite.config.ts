import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/mathtrainer/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['sounds/*.wav'],
      manifest: {
        name: 'Math Trainer',
        short_name: 'MathTrainer',
        description: 'Children\'s math practice app',
        theme_color: '#6366f1',
        background_color: '#f0f0ff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/mathtrainer/',
        icons: [
          { src: '/mathtrainer/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/mathtrainer/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
