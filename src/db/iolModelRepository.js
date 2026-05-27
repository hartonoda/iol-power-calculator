/**
 * Repository for IOL Model/Brand database operations
 */
class IolModelRepository {
    constructor(db) {
        this.db = db;
    }

    /**
     * Get all IOL models (non-deleted)
     */
    getAll() {
        const stmt = this.db.prepare(`
            SELECT id, name, isDefault, createdAt, updatedAt
            FROM iol_models 
            WHERE deletedAt IS NULL
            ORDER BY isDefault DESC, name ASC
        `);
        return stmt.all();
    }

    /**
     * Get a single IOL model by ID
     */
    getById(id) {
        const stmt = this.db.prepare(`
            SELECT id, name, isDefault, createdAt, updatedAt
            FROM iol_models 
            WHERE id = ? AND deletedAt IS NULL
        `);
        return stmt.get(id);
    }

    /**
     * Get a single IOL model by name
     */
    getByName(name) {
        const stmt = this.db.prepare(`
            SELECT id, name, isDefault, createdAt, updatedAt
            FROM iol_models 
            WHERE name = ? AND deletedAt IS NULL
        `);
        return stmt.get(name);
    }

    /**
     * Add a new IOL model
     */
    add(name) {
        const now = new Date().toISOString();
        
        // Check if model already exists (including soft-deleted)
        const existing = this.db.prepare(`
            SELECT id, deletedAt FROM iol_models WHERE name = ?
        `).get(name);

        if (existing) {
            if (existing.deletedAt) {
                // Restore soft-deleted model
                const stmt = this.db.prepare(`
                    UPDATE iol_models 
                    SET deletedAt = NULL, updatedAt = ?
                    WHERE id = ?
                `);
                stmt.run(now, existing.id);
                return { id: existing.id, name, restored: true };
            }
            // Model already exists
            return { id: existing.id, name, exists: true };
        }

        const stmt = this.db.prepare(`
            INSERT INTO iol_models (name, isDefault, createdAt, updatedAt)
            VALUES (?, 0, ?, ?)
        `);
        const result = stmt.run(name, now, now);
        return { id: result.lastInsertRowid, name };
    }

    /**
     * Update an IOL model name
     */
    update(id, name) {
        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
            UPDATE iol_models 
            SET name = ?, updatedAt = ?
            WHERE id = ? AND deletedAt IS NULL
        `);
        const result = stmt.run(name, now, id);
        return result.changes > 0;
    }

    /**
     * Soft delete an IOL model
     */
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

    /**
     * Import models from localStorage (for migration)
     * @param {string[]} models - Array of model names from localStorage
     */
    importFromLocalStorage(models) {
        const results = [];
        for (const name of models) {
            if (name && typeof name === 'string' && name.trim()) {
                const result = this.add(name.trim());
                results.push(result);
            }
        }
        return results;
    }
}

export default IolModelRepository;
