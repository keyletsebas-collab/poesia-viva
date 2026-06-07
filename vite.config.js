import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8888,
    strictPort: true
  },
  build: {
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core':   ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          'supabase':     ['@supabase/supabase-js'],
          'icons':        ['lucide-react'],
        }
      }
    },
    // Smaller chunks load faster on slow connections
    chunkSizeWarningLimit: 400,
  }
})
