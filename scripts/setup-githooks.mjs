#!/usr/bin/env node
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const hooksPath = path.join(root, '.githooks').replace(/\\/g, '/');

try {
  execSync('git rev-parse --git-dir', { cwd: root, stdio: 'ignore' });
} catch {
  process.exit(0);
}

execSync(`git config core.hooksPath "${hooksPath}"`, { cwd: root, stdio: 'inherit' });
console.log(`Git hooks path set to ${hooksPath}`);
