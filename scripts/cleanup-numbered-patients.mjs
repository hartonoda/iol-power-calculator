/**
 * Merge patients created with FileMaker list-number prefixes (e.g. "1 Arcangioli Mauro").
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function formatPatientName(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function stripListNumberPrefix(name) {
  return String(name || '').trim().replace(/^\d+\s+/, '');
}

const dbPaths = [
  path.join(projectRoot, 'iol-calculator-patient-data.sqlite'),
  path.join(os.homedir(), 'AppData', 'Roaming', 'IOL Power Calculator', 'database', 'iol-calculator-patient-data.sqlite'),
].filter((p, idx) => idx === 0 || fs.existsSync(p));

for (const dbPath of dbPaths) {
  const db = new DatabaseSync(dbPath);
  const numbered = db.prepare(`
    SELECT id, name
    FROM patients
    WHERE deletedAt IS NULL
      AND name GLOB '[0-9]*'
  `).all();

  if (!numbered.length) {
    console.log(`No numbered patients in ${dbPath}`);
    db.close();
    continue;
  }

  let merged = 0;
  let renamed = 0;
  let removed = 0;

  db.exec('BEGIN');
  try {
    for (const patient of numbered) {
      const canonicalName = formatPatientName(stripListNumberPrefix(patient.name));
      const canonical = db.prepare(`
        SELECT id
        FROM patients
        WHERE deletedAt IS NULL
          AND id != ?
          AND lower(trim(name)) = lower(trim(?))
        LIMIT 1
      `).get(patient.id, canonicalName);

      const ops = db.prepare(`
        SELECT id, operationDate, eye
        FROM operations
        WHERE patientId = ? AND deletedAt IS NULL
      `).all(patient.id);

      if (canonical?.id) {
        for (const op of ops) {
          const duplicate = db.prepare(`
            SELECT id
            FROM operations
            WHERE patientId = ?
              AND operationDate = ?
              AND eye = ?
              AND deletedAt IS NULL
            LIMIT 1
          `).get(canonical.id, op.operationDate, op.eye);

          if (duplicate) {
            db.prepare(`UPDATE operations SET deletedAt = ? WHERE id = ?`).run(new Date().toISOString(), op.id);
          } else {
            db.prepare(`UPDATE operations SET patientId = ? WHERE id = ?`).run(canonical.id, op.id);
          }
        }
        db.prepare(`UPDATE patients SET deletedAt = ? WHERE id = ?`).run(new Date().toISOString(), patient.id);
        merged += 1;
        removed += 1;
      } else {
        db.prepare(`UPDATE patients SET name = ? WHERE id = ?`).run(canonicalName, patient.id);
        renamed += 1;
      }
    }

    db.exec('COMMIT');
    console.log(`${dbPath}`);
    console.log(`  merged into existing: ${merged}`);
    console.log(`  renamed in place: ${renamed}`);
    console.log(`  removed duplicates: ${removed}`);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  } finally {
    db.close();
  }
}
