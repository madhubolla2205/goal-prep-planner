import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // `npm run server` runs the API alongside the dev server.
    proxy: { '/api': 'http://localhost:8787' },
  },
})
