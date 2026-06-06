#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const versionToken = pkg.version.replace(/\./g, '');
const sourceDir = path.join(root, 'out', `${pkg.productName}-win32-x64`);
const zipPath = path.join(root, 'out', `${pkg.productName}-win32-x64v${versionToken}.zip`);

if (!fs.existsSync(sourceDir)) {
  console.error(`Packaged app not found: ${sourceDir}`);
  console.error('Run "npm run package" or "npm run make" first.');
  process.exit(1);
}

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

const sourceArg = sourceDir.replace(/'/g, "''");
const zipArg = zipPath.replace(/'/g, "''");
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${sourceArg}\\*' -DestinationPath '${zipArg}' -Force"`,
  { stdio: 'inherit' },
);

console.log(`Portable zip created: ${zipPath}`);
