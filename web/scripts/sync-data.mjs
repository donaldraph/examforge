// Copies the canonical question banks and exam registry from the repo-root
// data/ directory into web/public/data so the frontend can fetch them as static
// assets. The repo-root data/ stays the single source of truth; the copy under
// public/data is gitignored and regenerated before every dev run and build.
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '..', '..', 'data');
const dest = resolve(here, '..', 'public', 'data');

if (!existsSync(src)) {
  console.error(`[sync-data] source not found: ${src}`);
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dirname(dest), { recursive: true });
await cp(src, dest, { recursive: true });
console.log(`[sync-data] copied ${src} -> ${dest}`);
