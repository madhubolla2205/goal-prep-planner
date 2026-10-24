import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app from /goal-prep-planner/; the deploy workflow
  // sets BASE_PATH. Local dev and `npm start` keep serving from the root.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    // `npm run server` runs the API alongside the dev server.
    proxy: { '/api': 'http://localhost:8787' },
  },
})
