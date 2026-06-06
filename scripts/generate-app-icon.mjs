#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import toIco from 'to-ico';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = path.join(root, 'src', 'assets', 'img', 'logo-icon.svg');
const outDir = path.join(root, 'src', 'assets', 'img');
const sizes = [256, 128, 64, 48, 32, 16];

const svg = fs.readFileSync(svgPath);

const pngBuffers = await Promise.all(
  sizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
);

fs.writeFileSync(path.join(outDir, 'logo.ico'), await toIco(pngBuffers));
fs.writeFileSync(path.join(outDir, 'logo.png'), pngBuffers[0]);

console.log('Generated logo.ico and logo.png');
