import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

/**
 * Emits sw.js with the list of every file in the build, so the whole app is
 * saved for offline use on the first visit. The version changes whenever any
 * file does, which makes browsers install the new copy.
 */
function serviceWorker(): Plugin {
  return {
    name: 'service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const publicFiles = readdirSync('public')
      const files = [...Object.keys(bundle), ...publicFiles].filter((f) => !f.endsWith('.map')).sort()
      const hash = createHash('sha256')
      for (const f of files) hash.update(f)
      for (const f of publicFiles) hash.update(readFileSync(`public/${f}`))
      const header = `const VERSION = ${JSON.stringify(hash.digest('hex').slice(0, 12))};\nconst PRECACHE = ${JSON.stringify(['./', ...files])};\n\n`
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: header + readFileSync('pwa/sw.js', 'utf8') })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app from /goal-prep-planner/; the deploy workflow
  // sets BASE_PATH. Local dev and `npm start` keep serving from the root.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), serviceWorker()],
  server: {
    // `npm run server` runs the API alongside the dev server.
    proxy: { '/api': 'http://localhost:8787' },
  },
})
