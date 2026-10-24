import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import { seoPages } from './seo-pages'

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
      // The plan pages and sitemap are for search engines, not the offline app.
      const files = [...Object.keys(bundle), ...publicFiles].filter((f) => !f.endsWith('.map') && !f.startsWith('plans/') && f !== 'sitemap.xml').sort()
      const hash = createHash('sha256')
      for (const f of files) hash.update(f)
      for (const f of publicFiles) hash.update(readFileSync(`public/${f}`))
      const header = `const VERSION = ${JSON.stringify(hash.digest('hex').slice(0, 12))};\nconst PRECACHE = ${JSON.stringify(['./', ...files])};\n\n`
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: header + readFileSync('pwa/sw.js', 'utf8') })
    },
  }
}

/**
 * Adds the GoatCounter visitor counter when GOATCOUNTER_CODE is set (only the
 * GitHub Pages workflow sets it). GoatCounter is free, sets no cookies and
 * stores no personal data. Local builds and the Android app stay untracked.
 */
function visitorCounter(): Plugin {
  const code = process.env.GOATCOUNTER_CODE?.trim()
  if (code && !/^[a-z0-9-]+$/.test(code)) throw new Error(`GOATCOUNTER_CODE "${code}" is not a GoatCounter site code`)
  return {
    name: 'visitor-counter',
    apply: 'build',
    transformIndexHtml() {
      if (!code) return []
      return [{
        tag: 'script',
        attrs: { 'data-goatcounter': `https://${code}.goatcounter.com/count`, async: true, src: 'https://gc.zgo.at/count.js' },
        injectTo: 'body',
      }]
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app from /goal-prep-planner/; the deploy workflow
  // sets BASE_PATH. Local dev and `npm start` keep serving from the root.
  base: process.env.BASE_PATH ?? '/',
  // The plan pages come before the service worker so it can leave them out of its list.
  plugins: [react(), seoPages(process.env.SITE_URL), serviceWorker(), visitorCounter()],
  server: {
    // `npm run server` runs the API alongside the dev server.
    proxy: { '/api': 'http://localhost:8787' },
  },
})
