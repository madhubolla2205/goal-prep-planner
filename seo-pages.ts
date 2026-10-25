// One web page per ready-made plan (STARTERS), plus an index page, a sitemap
// and the privacy policy, emitted into the GitHub Pages build. They give search
// engines something to find for "<exam> preparation plan"; each page's button opens
// the app with that plan ready to add.

import type { Plugin } from 'vite'
import { STARTERS, type Starter } from './src/lib/starters'
import { THEMES, detectTheme } from './src/lib/themes'

const IMPORTANCE = ['', 'Low', 'Some', 'Medium', 'High', 'Critical']

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const hours = (min: number) => (min % 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min / 60} h`)

const STYLE = `
:root { color-scheme: light dark; --bg: #f5f5fa; --surface: #fff; --border: #e6e5ee; --text: #14131c; --muted: #5f5d70; --a: #7c3aed; --b: #db2777; }
@media (prefers-color-scheme: dark) { :root { --bg: #0f0f15; --surface: #18181f; --border: #2c2c38; --text: #f2f1f7; --muted: #a3a1b3; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.6 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
main { width: min(820px, 100% - 32px); margin: 0 auto; padding: 24px 0 64px; }
a { color: var(--a); }
.brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; color: var(--text); text-decoration: none; }
.brand img { width: 32px; height: 32px; border-radius: 10px; }
.band { margin: 24px 0; padding: 28px; border-radius: 24px; color: #fff; background: linear-gradient(135deg, var(--a), var(--b)); }
.band h1 { margin: 0 0 8px; font-size: clamp(1.8rem, 5vw, 2.6rem); line-height: 1.15; }
.band p { margin: 0 0 18px; opacity: 0.95; }
.cta { display: inline-block; padding: 12px 22px; border-radius: 12px; background: #fff; color: #1e1b4b; font-weight: 800; text-decoration: none; }
.facts { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 18px; padding: 0; list-style: none; }
.facts li { padding: 4px 12px; border-radius: 999px; background: rgb(255 255 255 / 0.18); font-size: 0.9rem; }
section { margin: 28px 0; padding: 22px; border: 1px solid var(--border); border-radius: 18px; background: var(--surface); }
h2 { margin: 0 0 12px; font-size: 1.2rem; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 9px 6px; border-top: 1px solid var(--border); }
th { color: var(--muted); font-size: 0.85rem; font-weight: 600; border-top: 0; }
td:last-child, th:last-child { text-align: right; }
ul.how { margin: 0; padding-left: 20px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; padding: 0; list-style: none; }
.grid a { display: block; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); text-decoration: none; color: var(--text); font-weight: 650; }
.grid span { display: block; color: var(--muted); font-size: 0.85rem; font-weight: 400; }
footer { color: var(--muted); font-size: 0.9rem; }
`

/** The plan's colours, the same as in the app. */
function colours(s: Starter): string {
  const skills = s.skills.map((k, i) => ({ ...k, id: String(i), confidence: 0 }))
  const theme = THEMES[s.theme ?? detectTheme({ name: s.name, type: s.type, skills })]
  return `--a: ${theme.from}; --b: ${theme.to};`
}

function page(opts: { title: string; description: string; canonical: string; root: string; body: string; style?: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}" />
<link rel="canonical" href="${opts.canonical}" />
<meta property="og:title" content="${esc(opts.title)}" />
<meta property="og:description" content="${esc(opts.description)}" />
<meta property="og:url" content="${opts.canonical}" />
<link rel="icon" type="image/svg+xml" href="${opts.root}favicon.svg" />
<style>${STYLE}</style>
</head>
<body${opts.style ? ` style="${opts.style}"` : ''}>
<main>
<a class="brand" href="${opts.root}"><img src="${opts.root}favicon.svg" alt="" width="32" height="32" /> Goal Prep Planner</a>
${opts.body}
<footer><p>Goal Prep Planner is free, needs no sign-up, and keeps your plan and progress on your own device. It plans and tracks your preparation; it does not include study material. Also on <a href="https://github.com/madhubolla2205/goal-prep-planner/releases/latest/download/goal-prep-planner.apk">Android</a>. <a href="${opts.root}privacy/">Privacy policy</a>.</p></footer>
</main>
</body>
</html>
`
}

function starterPage(s: Starter, site: string): string {
  const total = s.skills.reduce((sum, k) => sum + k.estimatedHours, 0)
  const kind = s.type === 'exam' ? 'exam' : 'interview'
  const mocks = s.type === 'exam' ? 'full mock tests' : 'mock interviews'
  const rows = [...s.skills]
    .sort((a, b) => b.weight - a.weight)
    .map((k) => `<tr><td>${esc(k.name)}</td><td>${IMPORTANCE[k.weight]}</td><td>${k.estimatedHours} h</td></tr>`)
    .join('\n')
  const others = STARTERS.filter((o) => o.id !== s.id)
    .map((o) => `<li><a href="../${o.id}/">${esc(o.name)}<span>${Math.round(o.days / 7)} weeks</span></a></li>`)
    .join('\n')
  return page({
    title: `${s.name} preparation plan: free day-by-day study schedule`,
    description: s.summary,
    canonical: `${site}plans/${s.id}/`,
    root: '../../',
    style: colours(s),
    body: `
<div class="band">
<h1>${esc(s.name)} preparation plan</h1>
<p>${esc(s.summary)}</p>
<ul class="facts"><li>${s.skills.length} ${s.type === 'exam' ? 'subjects' : 'skills'}</li><li>About ${total} hours</li><li>${Math.round(s.days / 7)} weeks at ${hours(s.dailyMinutes)} a day</li><li>Free, no sign-up</li></ul>
<a class="cta" href="../../#starter=${s.id}">Start this plan free</a>
</div>
<section>
<h2>What the plan covers</h2>
<table>
<thead><tr><th>${s.type === 'exam' ? 'Subject' : 'Skill'}</th><th>Importance</th><th>Study time</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
<p>Hours are starting estimates for someone with working knowledge. Set your own ${kind} date and daily hours when you start; the plan scales to fit, and you can change any subject, importance or estimate.</p>
</section>
<section>
<h2>How the schedule works</h2>
<ul class="how">
<li>Every day gets a short list of 15-minute blocks, with the most important subjects you feel least sure about first.</li>
<li>Subjects you have already studied come back for short spaced reviews, so they stay fresh.</li>
<li>The last weeks are for revision and ${mocks}, each followed by time to go through your mistakes.</li>
<li>Log what you actually study and the plan rebuilds every day: miss a day and the rest of the plan adjusts.</li>
<li>Readiness, pace and streak show whether you are on track for the ${kind} date.</li>
</ul>
</section>
<section>
<h2>Other ready-made plans</h2>
<ul class="grid">
${others}
</ul>
</section>`,
  })
}

function indexPage(site: string): string {
  const list = STARTERS.map((s) => `<li><a href="${s.id}/">${esc(s.name)}<span>${s.type === 'exam' ? 'Exam' : 'Interview'} · ${Math.round(s.days / 7)} weeks</span></a></li>`).join('\n')
  return page({
    title: 'Free preparation plans for exams and interviews',
    description: 'Ready-made, day-by-day study plans for GATE, CAT, UPSC, SSC, bank PO, NEET, JEE, GRE and tech interviews. Free, no sign-up.',
    canonical: `${site}plans/`,
    root: '../',
    body: `
<div class="band">
<h1>Free preparation plans</h1>
<p>Pick your exam or interview, set your date and daily hours, and get a day-by-day schedule that adapts to what you actually study.</p>
<a class="cta" href="../">Make your own plan</a>
</div>
<section>
<h2>Ready-made plans</h2>
<ul class="grid">
${list}
</ul>
</section>`,
  })
}

/** The privacy policy that the Google Play listing links to. */
function privacyPage(site: string): string {
  return page({
    title: 'Privacy policy: Goal Prep Planner',
    description: 'Goal Prep Planner keeps your plans and progress on your own device. No account, no ads, no personal data collected.',
    canonical: `${site}privacy/`,
    root: '../',
    body: `
<div class="band">
<h1>Privacy policy</h1>
<p>Your plans and progress stay on your own device. Goal Prep Planner has no accounts, no ads and no server that stores your data.</p>
</div>
<section>
<h2>Who this covers</h2>
<p>This policy covers the Goal Prep Planner Android app and the website at <a href="${site}">${esc(site)}</a>. Both are made by madhubolla2205 and are free.</p>
<p>Last updated: 25 October 2026.</p>
</section>
<section>
<h2>What stays on your device</h2>
<p>Everything you enter (your goal, exam or interview date, subjects, study log, notes and settings) is saved only in the app's storage on your phone, or in your browser for the website. It is never sent to us or anyone else. Uninstalling the app, or clearing the website's data, deletes it.</p>
<p>You can save a backup file from <strong>Your data</strong> and restore it later. That file goes only where you choose to save or send it.</p>
</section>
<section>
<h2>What we collect</h2>
<p><strong>In the Android app: nothing.</strong> The app has no analytics, no tracking, no advertising and no crash reporting.</p>
<p><strong>On the website:</strong> we count visits with <a href="https://www.goatcounter.com/">GoatCounter</a>, which records the page visited, the referring site, browser type, screen size and country. It sets no cookies, does not track you across sites and stores no personal data. See <a href="https://www.goatcounter.com/help/privacy">GoatCounter's privacy policy</a>.</p>
</section>
<section>
<h2>Other services the app contacts</h2>
<ul class="how">
<li><strong>Google Fonts.</strong> The app and website load their typeface from Google Fonts, so Google receives a normal web request (including your IP address) when fonts load. See <a href="https://developers.google.com/fonts/faq/privacy">Google Fonts' privacy notes</a>.</li>
<li><strong>Things you choose to open.</strong> Sharing a plan, adding a study day to Google Calendar, sending to WhatsApp or opening a study tip's source only happens when you tap it, and that service's own privacy policy applies.</li>
</ul>
</section>
<section>
<h2>Permissions</h2>
<ul class="how">
<li><strong>Notifications:</strong> only if you turn on daily study reminders. Reminders are scheduled on your phone; nothing is sent from a server.</li>
<li><strong>Internet:</strong> to load fonts and open links you tap.</li>
</ul>
</section>
<section>
<h2>Children</h2>
<p>The app is meant for students preparing for exams and interviews. It collects no personal data from anyone, including children.</p>
</section>
<section>
<h2>Changes and contact</h2>
<p>If this policy changes, the new version will be posted on this page with a new date. Questions? Open an issue at <a href="https://github.com/madhubolla2205/goal-prep-planner/issues">github.com/madhubolla2205/goal-prep-planner/issues</a>.</p>
</section>`,
  })
}

/** Emits the pages; only for the website build, where `site` is its address. */
export function seoPages(site: string | undefined): Plugin {
  return {
    name: 'seo-pages',
    apply: 'build',
    generateBundle() {
      if (!site) return
      const today = new Date().toISOString().slice(0, 10)
      const urls = [site, `${site}plans/`, `${site}privacy/`, ...STARTERS.map((s) => `${site}plans/${s.id}/`)]
      for (const s of STARTERS) this.emitFile({ type: 'asset', fileName: `plans/${s.id}/index.html`, source: starterPage(s, site) })
      this.emitFile({ type: 'asset', fileName: 'plans/index.html', source: indexPage(site) })
      this.emitFile({ type: 'asset', fileName: 'privacy/index.html', source: privacyPage(site) })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`,
      })
    },
  }
}
