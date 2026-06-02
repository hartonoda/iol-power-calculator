import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const mdPath = path.join(
  process.env.USERPROFILE || '',
  '.cursor/projects/c-Users-hartono-Documents-hartonoda-git-iol-power-calculator/uploads/lensesTable.php-0.md',
);
const md = fs.readFileSync(mdPath, 'utf8');

function parseBarrett(raw) {
  const s = String(raw || '')
    .replace(/\\/g, '')
    .replace(/–/g, '-')
    .trim();
  const parts = s.match(/-?\d+\.\d+/g);
  if (!parts?.length) return { barrett: null, barrettDf: null };
  return {
    barrett: parseFloat(parts[0]),
    barrettDf: parts[1] != null ? parseFloat(parts[1]) : null,
  };
}

function extractConstants(line) {
  const cells = line.split('|').map((c) => c.trim());
  let powerEnd = -1;
  for (let i = 0; i < cells.length; i++) {
    if (/\d+to\d+\(/.test(cells[i])) powerEnd = i;
  }
  const cc = [];
  for (let i = powerEnd + 1; i < cells.length; i++) {
    const c = cells[i].replace(/\\/g, '').replace(/–/g, '-').trim();
    if (c && c !== '-' && /[\d]/.test(c) && !/^yes|^no$/i.test(c)) cc.push(c);
  }
  if (!cc.length) return null;

  const nominalA = parseFloat(cc[0]);
  let hofferPacd;
  let barrettRaw;

  if (cc.length >= 11) {
    hofferPacd = parseFloat(cc[7]);
    barrettRaw = cc[10];
  } else if (cc.length >= 6) {
    hofferPacd = parseFloat(cc[2]);
    barrettRaw = cc[5];
  } else if (cc.length >= 3) {
    hofferPacd = parseFloat(cc[2]);
    barrettRaw = null;
  } else {
    return null;
  }

  const { barrett, barrettDf } = parseBarrett(barrettRaw);
  return {
    nominalA: Number.isFinite(nominalA) ? nominalA : null,
    hofferPacd: Number.isFinite(hofferPacd) ? hofferPacd : null,
    barrett,
    barrettDf,
  };
}

const models = [
  ['Alcon MA60MA (+/-5)', 'MA60MA (+D)'],
  ['Alcon MA60AC', 'MA60AC'],
  ['Alcon SA60AT', 'SA60AT'],
  ['Alcon SN60WF', 'SN60WF'],
  ['Alcon SN6AT', 'SN6AT (2-9)'],
  ['Alcon Clareon', 'Clareon SY60WF'],
  ['Alcon Clareon T', 'Clareon Toric CNW0T2'],
  ['Alcon Vivity', 'Clareon Vivity CNWET0'],
  ['Alcon Vivity T', 'Vivity Toric CNWET2'],
  ['Alcon Panoptix', 'PanOptix CNWTT0'],
  ['Alcon Panoptix T', 'PanOptix Toric CNWTT2'],
  ['J&J Eyhance', 'DIB00'],
  ['J&J Eyhance T', 'DIU'],
  ['J&J Puresee', 'DEN00V'],
  ['Luxsmart', 'LuxSmart'],
  ['Luxsmart T', 'LuxSmart toric'],
  ['BVI isopure serenity', 'ISOPURE'],
];

const out = {};
for (const [label, needle] of models) {
  const idx = md.indexOf(needle);
  if (idx < 0) {
    console.error('NOT FOUND', label);
    continue;
  }
  const line = md.slice(md.lastIndexOf('\n', idx) + 1, md.indexOf('\n', idx));
  out[label] = extractConstants(line);
  console.log(label, out[label]);
}
console.log('\n', JSON.stringify(out, null, 2));
