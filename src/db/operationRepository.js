import { VALUTAZIONE_DB_FIELDS } from '../config/valutazioneSchema.js';

class OperationRepository {
  constructor(db) {
    this.db = db;
  }

  add(operation) {
    if (!operation.patientId) {
      return { success: false, error: 'Selezionare un paziente.' };
    }
    if (!operation.eye) {
      return { success: false, error: "Selezionare l'occhio (OD/OS)." };
    }

    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const cols = [...VALUTAZIONE_DB_FIELDS, 'createdAt', 'updatedAt', 'deletedAt'];
    const placeholders = cols.map(() => '?').join(', ');
    const values = VALUTAZIONE_DB_FIELDS.map((c) => operation[c] ?? null);
    values.push(createdAt, updatedAt, null);

    try {
      const info = this.db.prepare(`
        INSERT INTO operations (${cols.join(', ')})
        VALUES (${placeholders})
      `).run(...values);
      return { success: true, id: info.lastInsertRowid };
    } catch (err) {
      console.error('Error adding operation:', err);
      return { success: false, error: err.message };
    }
  }

  update(operation) {
    if (!operation.id) {
      return { success: false, error: 'ID mancante.' };
    }
    const updatedAt = new Date().toISOString();
    const setClause = VALUTAZIONE_DB_FIELDS.map((c) => `${c} = ?`).join(', ');
    const values = VALUTAZIONE_DB_FIELDS.map((c) => operation[c] ?? null);
    values.push(updatedAt, operation.id);

    this.db.prepare(`
      UPDATE operations SET ${setClause}, updatedAt = ?
      WHERE id = ?
    `).run(...values);

    return { success: true };
  }

  delete(id) {
    const deletedAt = new Date().toISOString();
    this.db.prepare('UPDATE operations SET deletedAt = ? WHERE id = ?').run(deletedAt, id);
    return { success: true };
  }

  getAll() {
    return this.db.prepare(`
      SELECT o.*, p.name AS patientName
      FROM operations o
      LEFT JOIN patients p ON o.patientId = p.id
      WHERE o.deletedAt IS NULL
      ORDER BY o.operationDate DESC
    `).all();
  }

  getById(id) {
    return this.db.prepare(`
      SELECT o.*, p.name AS patientName
      FROM operations o
      LEFT JOIN patients p ON o.patientId = p.id
      WHERE o.id = ? AND o.deletedAt IS NULL
    `).get(id);
  }

  getByPatientId(patientId) {
    return this.db.prepare(`
      SELECT * FROM operations
      WHERE patientId = ? AND deletedAt IS NULL
      ORDER BY operationDate DESC
    `).all(patientId);
  }

  getOtherEye(operationId) {
    const operation = this.getById(operationId);
    if (!operation) return null;
    if (operation.linkedOperationId) {
      return this.getById(operation.linkedOperationId);
    }
    return this.db.prepare(`
      SELECT o.*, p.name AS patientName
      FROM operations o
      LEFT JOIN patients p ON o.patientId = p.id
      WHERE o.linkedOperationId = ? AND o.deletedAt IS NULL
    `).get(operationId);
  }

  updateLinkedOperationId(operationId, linkedId) {
    this.db.prepare('UPDATE operations SET linkedOperationId = ? WHERE id = ?').run(linkedId, operationId);
    return { success: true };
  }

  addPaired(baseOperation) {
    const od = { ...baseOperation, eye: 'OD' };
    const odResult = this.add(od);
    if (!odResult.success) return odResult;

    const os = {
      operationDate: baseOperation.operationDate,
      patientId: baseOperation.patientId,
      age: baseOperation.age,
      interventoDi: baseOperation.interventoDi,
      costo: baseOperation.costo,
      noteIntervento: baseOperation.noteIntervento,
      noteSistemic: baseOperation.noteSistemic,
      eye: 'OS',
      linkedOperationId: odResult.id,
    };
    const osResult = this.add(os);
    if (!osResult.success) {
      this.delete(odResult.id);
      return osResult;
    }
    this.updateLinkedOperationId(odResult.id, osResult.id);
    return { success: true, id: odResult.id, odId: odResult.id, osId: osResult.id, primaryId: odResult.id };
  }

  deletePaired(operationId) {
    const other = this.getOtherEye(operationId);
    this.delete(operationId);
    if (other) this.delete(other.id);
    return { success: true };
  }
}

export default OperationRepository;
