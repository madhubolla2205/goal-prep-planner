// Small API server for the planner. Serves POST /api/plan (Claude-generated
// skill breakdown) and, in production, the built app from dist/.
//
//   ANTHROPIC_API_KEY=... npm start
//
// Without credentials the endpoint answers 503 and the app falls back to its
// built-in rules.
import Anthropic from '@anthropic-ai/sdk';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { planGoal } from './planGoal.ts';

const PORT = Number(process.env.PORT ?? 8787);
const DIST = resolve(import.meta.dirname, '..', 'dist');
const MAX_TEXT = 1000;

const hasCredentials = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const client = hasCredentials ? new Anthropic() : null;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 10_000) throw new Error('Body too large');
  }
  return body;
}

async function handlePlan(req: IncomingMessage, res: ServerResponse) {
  if (!client) return sendJson(res, 503, { error: 'AI planning is not configured' });
  let text: unknown;
  let today: unknown;
  try {
    ({ text, today } = JSON.parse(await readBody(req)));
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON' });
  }
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT) {
    return sendJson(res, 400, { error: 'Describe your goal in under 1000 characters' });
  }
  if (typeof today !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    return sendJson(res, 400, { error: 'Missing today' });
  }
  try {
    const plan = await planGoal(client, text.trim(), today);
    if (!plan) return sendJson(res, 502, { error: 'No plan returned' });
    sendJson(res, 200, plan);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error('Anthropic credentials were rejected');
      return sendJson(res, 503, { error: 'AI planning is not configured' });
    }
    if (err instanceof Anthropic.RateLimitError) return sendJson(res, 429, { error: 'Busy, try again shortly' });
    console.error('Plan request failed:', err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
    sendJson(res, 502, { error: 'Planning failed' });
  }
}

function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]));
  let file = join(DIST, path);
  if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404).end('Run `npm run build` first, or use `npm run dev`.');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  if (req.url === '/api/plan' && req.method === 'POST') return void handlePlan(req, res);
  if (req.url === '/api/health') return sendJson(res, 200, { ai: Boolean(client) });
  serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`Planner server on http://localhost:${PORT} (AI planning ${client ? 'on' : 'off: set ANTHROPIC_API_KEY'})`);
});
