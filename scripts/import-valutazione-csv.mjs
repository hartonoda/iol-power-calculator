/**
 * One-shot import: valutazione.csv → iol-calculator-patient-data.sqlite
 * Usage: node scripts/import-valutazione-csv.mjs [csvPath] [dbPath]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import {
  extractPatientsFromValutazioneFile,
  DEFAULT_CSV_PATH,
} from '../src/services/valutazioneImport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const csvPath = process.argv[2] || DEFAULT_CSV_PATH;
const dbPath =
  process.argv[3] ||
  process.env.IOL_DB_PATH ||
  path.join(projectRoot, 'iol-calculator-patient-data.sqlite');

if (!fs.existsSync(csvPath)) {
  console.error('CSV not found:', csvPath);
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    dateOfBirth TEXT NOT NULL,
    gender TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT NULL
  )
`);

const checkExists = db.prepare(`
  SELECT id FROM patients
  WHERE name = ? AND dateOfBirth = ? AND deletedAt IS NULL
`);
const insert = db.prepare(`
  INSERT INTO patients (name, dateOfBirth, gender, createdAt, updatedAt, deletedAt)
  VALUES (?, ?, ?, ?, ?, NULL)
`);
const countAll = db.prepare('SELECT COUNT(*) AS n FROM patients WHERE deletedAt IS NULL');

const patients = extractPatientsFromValutazioneFile(csvPath);
const now = new Date().toISOString();
let added = 0;
let skipped = 0;

db.exec('BEGIN');
try {
  for (const { name, dateOfBirth, gender } of patients) {
    if (!name || !dateOfBirth) {
      skipped += 1;
      continue;
    }
    if (checkExists.get(name, dateOfBirth)) {
      skipped += 1;
      continue;
    }
    insert.run(name, dateOfBirth, gender || '', now, now);
    added += 1;
  }
  db.exec('COMMIT');
} catch (err) {
  db.exec('ROLLBACK');
  throw err;
}

console.log('Database:', dbPath);
console.log('Source:', csvPath);
console.log('Unique patients in file:', patients.length);
console.log('Added:', added);
console.log('Skipped (already present):', skipped);
console.log('Total in DB:', countAll.get().n);

db.close();
