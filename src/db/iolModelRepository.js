/**
 * Repository for IOL Model/Brand database operations
 */
import { IOL_CONSTANT_FIELDS } from '../config/iolModelConstantsDefaults.js';

const SELECT_COLUMNS = [
  'id',
  'name',
  'isDefault',
  'nominalA',
  'hofferPacd',
  'barrett',
  'barrettDf',
  'createdAt',
  'updatedAt',
].join(', ');

function pickConstants(input) {
  const out = {};
  for (const key of IOL_CONSTANT_FIELDS) {
    if (input[key] !== undefined) {
      const val = input[key];
      out[key] = val === '' || val === null ? null : Number(val);
    }
  }
  return out;
}

function normalizeName(input) {
  if (typeof input === 'string') return input.trim();
  return String(input?.name || '').trim();
}

class IolModelRepository {
  constructor(db) {
    this.db = db;
  }

  getAll() {
    const stmt = this.db.prepare(`
            SELECT ${SELECT_COLUMNS}
            FROM iol_models 
            WHERE deletedAt IS NULL
            ORDER BY isDefault DESC, name ASC
        `);
    return stmt.all();
  }

  getById(id) {
    const stmt = this.db.prepare(`
            SELECT ${SELECT_COLUMNS}
            FROM iol_models 
            WHERE id = ? AND deletedAt IS NULL
        `);
    return stmt.get(id);
  }

  getByName(name) {
    const stmt = this.db.prepare(`
            SELECT ${SELECT_COLUMNS}
            FROM iol_models 
            WHERE name = ? AND deletedAt IS NULL
        `);
    return stmt.get(name);
  }

  add(input) {
    const name = normalizeName(input);
    if (!name) throw new Error('Model name is required');

    const constants = typeof input === 'object' ? pickConstants(input) : {};
    const now = new Date().toISOString();

    const existing = this.db.prepare(`
            SELECT id, deletedAt FROM iol_models WHERE name = ?
        `).get(name);

    if (existing) {
      if (existing.deletedAt) {
        this.update(existing.id, { name, ...constants });
        return { id: existing.id, name, restored: true };
      }
      return { id: existing.id, name, exists: true };
    }

    const cols = ['name', 'isDefault', ...IOL_CONSTANT_FIELDS, 'createdAt', 'updatedAt'];
    const placeholders = cols.map(() => '?').join(', ');
    const values = [
      name,
      0,
      ...IOL_CONSTANT_FIELDS.map((k) => constants[k] ?? null),
      now,
      now,
    ];

    const stmt = this.db.prepare(`
            INSERT INTO iol_models (${cols.join(', ')})
            VALUES (${placeholders})
        `);
    const result = stmt.run(...values);
    return { id: result.lastInsertRowid, name };
  }

  update(id, data) {
    const name = data.name !== undefined ? normalizeName(data) : undefined;
    const constants = pickConstants(data);
    const now = new Date().toISOString();

    const sets = ['updatedAt = ?'];
    const values = [now];

    if (name !== undefined) {
      sets.push('name = ?');
      values.push(name);
    }
    for (const key of IOL_CONSTANT_FIELDS) {
      if (data[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(constants[key] ?? null);
      }
    }

    values.push(id);
    const stmt = this.db.prepare(`
            UPDATE iol_models 
            SET ${sets.join(', ')}
            WHERE id = ? AND deletedAt IS NULL
        `);
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  delete(id) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
            UPDATE iol_models 
            SET deletedAt = ?, updatedAt = ?
            WHERE id = ?
        `);
    const result = stmt.run(now, now, id);
    return result.changes > 0;
  }

  applyDefaultConstants(defaultsByName, { refreshKnownDefaults = false } = {}) {
    const whereClause = refreshKnownDefaults
      ? 'WHERE name = ? AND deletedAt IS NULL'
      : 'WHERE name = ? AND deletedAt IS NULL AND (hofferPacd IS NULL OR barrett IS NULL)';
    const stmt = this.db.prepare(`
            UPDATE iol_models
            SET nominalA = ?, hofferPacd = ?, barrett = ?, barrettDf = ?, updatedAt = ?
            ${whereClause}
        `);
    const now = new Date().toISOString();
    let updated = 0;
    for (const [name, c] of Object.entries(defaultsByName)) {
      if (!c) continue;
      const result = stmt.run(
        c.nominalA ?? null,
        c.hofferPacd ?? null,
        c.barrett ?? null,
        c.barrettDf ?? null,
        now,
        name,
      );
      updated += result.changes;
    }
    return updated;
  }

  importFromLocalStorage(models) {
    const results = [];
    for (const name of models) {
      if (name && typeof name === 'string' && name.trim()) {
        results.push(this.add(name.trim()));
      }
    }
    return results;
  }
}

export default IolModelRepository;
