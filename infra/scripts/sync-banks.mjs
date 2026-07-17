// Copies the canonical question banks and exam registry from the repo-root data/
// directory into infra/lambdas/banks so the scoring lambda can grade attempts
// against the authoritative answer key. The repo-root data/ stays the single
// source of truth; the bundled copy is gitignored and regenerated before every
// synth and deploy.
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '..', '..', 'data');
const dest = resolve(here, '..', 'lambdas', 'banks');

if (!existsSync(src)) {
  console.error(`[sync-banks] source not found: ${src}`);
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dirname(dest), { recursive: true });
await cp(src, dest, { recursive: true });
console.log(`[sync-banks] copied ${src} -> ${dest}`);
