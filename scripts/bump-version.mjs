#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

if (process.env.SKIP_VERSION_BUMP === '1') {
  process.exit(0);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = path.join(root, 'package.json');
const lockPath = path.join(root, 'package-lock.json');

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const parts = pkg.version.split('.').map(Number);

if (parts.length !== 3 || parts.some(Number.isNaN)) {
  console.error(`Invalid semver in package.json: ${pkg.version}`);
  process.exit(1);
}

parts[2] += 1;
pkg.version = parts.join('.');
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

try {
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  lock.version = pkg.version;
  if (lock.packages?.['']) {
    lock.packages[''].version = pkg.version;
  }
  writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
} catch (error) {
  console.warn(`Could not update package-lock.json: ${error.message}`);
}

console.log(`Version bumped to ${pkg.version}`);
