import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Ensure one React instance across the app and lazy-loaded chunks (avoids
  // "Invalid hook call" / useContext on null with dynamic imports).
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['qrcode', 'html2canvas'],
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom',
            'react-redux',
            '@reduxjs/toolkit',
          ],
          'vendor-mui': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
          ],
          'vendor-charts': ['lightweight-charts'],
          'vendor-heavy': ['html2canvas', 'qrcode', 'react-pdf'],
        },
      },
    },
  },
  server: {
    historyApiFallback: true,
    hmr: {
      overlay: false,
    },
  },
})
