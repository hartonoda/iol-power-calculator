class PatientRepository {
  constructor(db) {
    this.db = db;
  }

  checkPatientExists(name, dateOfBirth) {
    return this.db.prepare(`
      SELECT id FROM patients
      WHERE name = ? AND dateOfBirth = ? AND deletedAt IS NULL
    `).get(name, dateOfBirth);
  }

  add(patient) {
    const { name, dateOfBirth, gender } = patient;
    const existing = this.checkPatientExists(name, dateOfBirth);
    if (existing) {
      return { success: false, error: 'Esiste già un paziente con lo stesso nome e data di nascita.' };
    }

    const now = new Date().toISOString();
    const info = this.db.prepare(`
      INSERT INTO patients (name, dateOfBirth, gender, createdAt, updatedAt, deletedAt)
      VALUES (?, ?, ?, ?, ?, NULL)
    `).run(name, dateOfBirth, gender || '', now, now);

    return { success: true, id: info.lastInsertRowid };
  }

  update(patient) {
    const { id, name, dateOfBirth, gender } = patient;
    if (!id || !name || !dateOfBirth) {
      return { success: false, error: 'Campi obbligatori mancanti.' };
    }

    const existing = this.db.prepare(`
      SELECT id FROM patients
      WHERE name = ? AND dateOfBirth = ? AND id != ? AND deletedAt IS NULL
    `).get(name, dateOfBirth, id);

    if (existing) {
      return { success: false, error: 'Esiste già un paziente con lo stesso nome e data di nascita.' };
    }

    const updatedAt = new Date().toISOString();
    this.db.prepare(`
      UPDATE patients SET name = ?, dateOfBirth = ?, gender = ?, updatedAt = ?
      WHERE id = ?
    `).run(name, dateOfBirth, gender || '', updatedAt, id);

    return { success: true };
  }

  delete(id) {
    const deletedAt = new Date().toISOString();
    this.db.prepare('UPDATE patients SET deletedAt = ? WHERE id = ?').run(deletedAt, id);
    return { success: true };
  }

  getAll() {
    return this.db.prepare('SELECT * FROM patients WHERE deletedAt IS NULL ORDER BY name').all();
  }

  getById(id) {
    return this.db.prepare('SELECT * FROM patients WHERE id = ? AND deletedAt IS NULL').get(id);
  }

  importBatch(patients) {
    const insert = this.db.prepare(`
      INSERT INTO patients (name, dateOfBirth, gender, createdAt, updatedAt, deletedAt)
      VALUES (?, ?, ?, ?, ?, NULL)
    `);
    const now = new Date().toISOString();
    let added = 0;
    let skipped = 0;

    const run = this.db.transaction((list) => {
      for (const patient of list) {
        const { name, dateOfBirth, gender } = patient;
        if (!name || !dateOfBirth) {
          skipped += 1;
          continue;
        }
        if (this.checkPatientExists(name, dateOfBirth)) {
          skipped += 1;
          continue;
        }
        insert.run(name, dateOfBirth, gender || '', now, now);
        added += 1;
      }
      return { added, skipped };
    });

    return run(patients);
  }
}

export default PatientRepository;
