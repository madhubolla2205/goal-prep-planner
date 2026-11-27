// Opens the debug app on an Android emulator and checks the screens a tester
// sees: no stray title bar above the app, the header (logo, language picker,
// Feedback button) inside the screen, and the main tabs in light and dark mode.
// Run by .github/workflows/android-emulator.yml; screenshots land in $OUT.

const { _android: android } = require('playwright');
const fs = require('node:fs');

const PKG = 'io.github.madhubolla2205.goalprep';
const OUT = process.env.OUT || 'emulator-screens';
const API = process.env.API_LEVEL || '?';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  console.log(results.at(-1));
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

function day(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
const skills = [
  { id: 's1', name: 'Algorithms', weight: 3, estimatedHours: 40, confidence: 30 },
  { id: 's2', name: 'Operating Systems', weight: 2, estimatedHours: 25, confidence: 30 },
];
const plan = (id, name, type, days) => ({
  id, name, type, startDate: day(-10), targetDate: day(days), dailyMinutes: 120, restDays: [], skills,
  log: [{ id: `${id}a`, date: day(-2), skillId: 's1', minutes: 45 }, { id: `${id}b`, date: day(-1), skillId: 's2', minutes: 60 }],
});
const STATE = { goals: [plan('g1', 'GATE CSE', 'exam', 60), plan('g2', 'Amazon SDE interview', 'interview', 30), plan('g3', 'CAT', 'exam', 90)], activeGoalId: 'g1' };

(async () => {
  const [device] = await android.devices();
  const shot = async (name) => device.screenshot({ path: `${OUT}/api${API}-${name}.png` });

  // A window title bar shows up as an action bar in the native view tree.
  async function noTitleBar(when) {
    await device.shell('uiautomator dump /sdcard/ui.xml');
    const xml = (await device.shell('cat /sdcard/ui.xml')).toString();
    const bar = /action_bar|resource-id="android:id\/title"/.test(xml);
    check(`no title bar above the app (${when})`, !bar);
  }

  async function launch() {
    await device.shell(`am force-stop ${PKG}`);
    await device.shell(`monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`);
    const webview = await device.webView({ pkg: PKG }, { timeout: 60000 });
    const page = await webview.page();
    await page.waitForSelector('.topbar', { timeout: 30000 });
    await pause(2500);
    return page;
  }

  // The header must start below the status bar and its Feedback button be on screen.
  async function headerVisible(page, when) {
    const info = await page.evaluate(() => {
      const top = document.querySelector('.topbar').getBoundingClientRect().top;
      const btn = [...document.querySelectorAll('.topbar button')].find((b) => b.getAttribute('aria-label') === 'Feedback');
      const r = btn?.getBoundingClientRect();
      const inset = getComputedStyle(document.querySelector('.app')).paddingTop;
      return { top, inset, btn: r ? { x: r.x, y: r.y, w: r.width, h: r.height, vw: innerWidth } : null };
    });
    check(`Feedback button in the header (${when})`, !!info.btn && info.btn.w > 0 && info.btn.y >= 0 && info.btn.x + info.btn.w <= info.btn.vw, JSON.stringify(info));
  }

  try {
    await device.shell('cmd uimode night no');
    await device.shell(`pm clear ${PKG}`);

    // First run: the new-plan screen.
    let page = await launch();
    await shot('01-first-run');
    await noTitleBar('first run');

    // Three plans, as a tester would have after a few days.
    await page.evaluate((s) => localStorage.setItem('goal-prep-planner/v1', JSON.stringify(s)), STATE);
    page = await launch();
    await shot('02-home');
    await noTitleBar('home');
    await headerVisible(page, 'home');

    await page.locator('.topbar button[aria-label="Feedback"]').click();
    await pause(1500);
    await shot('03-home-feedback-card');
    const playHref = await page.locator('#feedback a').first().getAttribute('href');
    check('Feedback card links to Google Play', playHref === `https://play.google.com/store/apps/details?id=${PKG}`, playHref);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.plan-card').first().click();
    await pause(1500);
    await shot('04-today');
    await headerVisible(page, 'plan');
    check('Feedback prompt on Today', await page.locator('.feedback-nudge').isVisible());

    for (const [i, tab] of [['05', 'Plan'], ['06', 'Progress'], ['07', 'Adjust']]) {
      await page.getByRole('tab', { name: tab, exact: true }).click();
      await pause(1200);
      await shot(`${i}-${tab.toLowerCase()}`);
    }
    await page.locator('.topbar button[aria-label="Feedback"]').click();
    await pause(1500);
    await shot('08-adjust-feedback');
    check('Feedback card on Adjust', await page.locator('#feedback').isVisible());

    // Tapping the Play link must leave the app for the browser or Play Store.
    await page.locator('#feedback a').first().click();
    await pause(4000);
    const focus = (await device.shell('dumpsys window | grep -E "mCurrentFocus|mFocusedApp"')).toString();
    check('Google Play link opens outside the app', !focus.includes(`${PKG}/`) || /chrome|browser|vending/i.test(focus), focus.trim().split('\n')[0]);
    await shot('09-after-play-link');

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.topbar button[aria-label="New plan"]').click();
    await pause(1200);
    await shot('10-new-plan');

    // Dark mode.
    await device.shell('cmd uimode night yes');
    await pause(2000);
    page = await launch();
    await shot('11-dark-home');
    await noTitleBar('dark mode');
    await headerVisible(page, 'dark mode');
  } catch (e) {
    check('checks ran to the end', false, String(e).split('\n')[0]);
  }

  fs.writeFileSync(`${OUT}/api${API}-results.txt`, results.join('\n') + '\n');
  await device.close();
  process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
})();
