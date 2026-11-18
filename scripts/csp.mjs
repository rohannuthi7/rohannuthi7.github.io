// Runs after `astro build`. Hashes every inline <script> in dist/**/*.html and
// writes a Content-Security-Policy into dist/_headers so inline scripts work
// without 'unsafe-inline'. Inline style attributes still need 'unsafe-inline'
// for style-src; hashes cannot cover attributes.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist', import.meta.url));
const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : []; });
const hashes = new Set();
for (const file of walk(dist)) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    hashes.add(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  }
}
const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(' ')}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');
const headersFile = join(dist, '_headers');
const existing = readFileSync(headersFile, 'utf8').replace(/\r\n/g, '\n').replace(/\n  Content-Security-Policy:.*\n/g, '\n');
writeFileSync(headersFile, existing.replace('/*\n', `/*\n  Content-Security-Policy: ${csp}\n`));
console.log(`CSP written with ${hashes.size} inline script hash(es)`);
