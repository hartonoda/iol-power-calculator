import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const DB_NAME = 'patient_data.sqlite';
const OLD_DB_NAME = 'operation-eye.sqlite'; // For migration from old name
const DB_VERSION = 6; // Increment this when adding new migrations

// Legacy folder for backward compatibility (old app used operation-eye)
const LEGACY_APP_DATA = 'operation-eye';

class AppDatabase {
    constructor() {
        // AppData\Roaming\SmartIOL\database - backup location (userData = SmartIOL from productName)
        this.appDataPath = path.join(app.getPath('userData'), 'database');
        this.appDataDbPath = path.join(this.appDataPath, DB_NAME);

        // Exe folder path (Program Files is read-only - we must use AppData there)
        this.exeDbPath = process.env.NODE_ENV === 'development'
            ? path.join(app.getAppPath(), DB_NAME)
            : path.join(path.dirname(process.execPath), DB_NAME);
        this.exeOldDbPath = process.env.NODE_ENV === 'development'
            ? path.join(app.getAppPath(), OLD_DB_NAME)
            : path.join(path.dirname(process.execPath), OLD_DB_NAME);

        // Primary database preference:
        // - Use exe folder database as the main working DB when writable.
        // - Use AppData only as backup (and as fallback when exe folder is not writable).
        this.exeFolderWritable = this.checkExeFolderWritable();
        this.primaryDbPath = this.exeFolderWritable ? this.exeDbPath : this.appDataDbPath;
        this.oldPrimaryDbPath = this.exeFolderWritable ? this.exeOldDbPath : path.join(this.appDataPath, OLD_DB_NAME);

        if (!this.exeFolderWritable) {
            console.log('Exe folder not writable (e.g. Program Files) - using AppData as runtime fallback');
        }

        // Legacy: AppData\Roaming\operation-eye (backward compatibility)
        this.legacyAppDataDir = path.join(app.getPath('appData'), LEGACY_APP_DATA);

        this.ensureAppDataDirectory();
        this.initializeDatabase();
        this.setupTables();
        this.runMigrations();
        this.mergeFromOperationEyeIfExists();
        this.backupToAppData();

        console.log('Database initialized successfully');
        console.log('Primary DB:', this.primaryDbPath);
        console.log('Backup DB (SmartIOL):', this.appDataDbPath);
    }

    checkExeFolderWritable() {
        const exeDir = path.dirname(this.exeDbPath);
        try {
            const testFile = path.join(exeDir, '.smartiol-write-test');
            fs.writeFileSync(testFile, '');
            fs.unlinkSync(testFile);
            return true;
        } catch {
            return false;
        }
    }

    ensureAppDataDirectory() {
        if (!fs.existsSync(this.appDataPath)) {
            fs.mkdirSync(this.appDataPath, { recursive: true });
            console.log('Created AppData database directory:', this.appDataPath);
        }
    }

    copyAppDataToPrimary() {
        fs.copyFileSync(this.appDataDbPath, this.primaryDbPath);
        const backupWal = this.appDataDbPath + '-wal';
        const backupShm = this.appDataDbPath + '-shm';
        if (fs.existsSync(backupWal)) {
            fs.copyFileSync(backupWal, this.primaryDbPath + '-wal');
        }
        if (fs.existsSync(backupShm)) {
            fs.copyFileSync(backupShm, this.primaryDbPath + '-shm');
        }
    }

    initializeDatabase() {
        let primaryExists = fs.existsSync(this.primaryDbPath);
        let oldPrimaryExists = fs.existsSync(this.oldPrimaryDbPath);
        const appDataExists = fs.existsSync(this.appDataDbPath);
        const exeDbExists = fs.existsSync(this.exeDbPath);
        const exeOldExists = fs.existsSync(this.exeOldDbPath);

        console.log('Database check:', {
            primaryExists,
            oldPrimaryExists,
            appDataExists,
            exeFolderWritable: this.exeFolderWritable,
            primaryPath: this.primaryDbPath,
            appDataPath: this.appDataDbPath
        });

        if (this.exeFolderWritable) {
            // 1) Migrate old exe DB name if needed
            if (!primaryExists && oldPrimaryExists) {
                console.log('Found old exe database name, migrating to new name...');
                fs.renameSync(this.oldPrimaryDbPath, this.primaryDbPath);
                const oldWal = this.oldPrimaryDbPath + '-wal';
                const oldShm = this.oldPrimaryDbPath + '-shm';
                const newWal = this.primaryDbPath + '-wal';
                const newShm = this.primaryDbPath + '-shm';
                if (fs.existsSync(oldWal)) fs.renameSync(oldWal, newWal);
                if (fs.existsSync(oldShm)) fs.renameSync(oldShm, newShm);
            }

            // 2) Startup restore policy (exe DB is main runtime DB):
            // - Copy AppData backup to exe DB ONLY when exe DB file does not exist.
            // - If exe DB already exists, keep it as the latest working DB.
            const exeNowExists = fs.existsSync(this.primaryDbPath);
            const shouldRestoreFromBackup = appDataExists && !exeNowExists;
            if (shouldRestoreFromBackup) {
                console.log('AppData backup found and exe DB missing - restoring backup to exe DB');
                try {
                    this.copyAppDataToPrimary();
                } catch (err) {
                    console.error('Failed to copy AppData backup to exe DB:', err);
                }
            } else if (!exeNowExists) {
                console.log('No AppData backup found - exe DB will be created fresh');
            } else {
                console.log('Exe DB exists - skipping startup restore from AppData');
            }
        } else if ((exeDbExists || exeOldExists) && !appDataExists) {
            // Exe path cannot be used at runtime, but migrate existing exe DB into AppData once.
            const srcPath = exeDbExists ? this.exeDbPath : this.exeOldDbPath;
            console.log('Migrating exe DB to AppData fallback location:', srcPath);
            try {
                fs.copyFileSync(srcPath, this.appDataDbPath);
                const wal = srcPath + '-wal';
                const shm = srcPath + '-shm';
                if (fs.existsSync(wal)) fs.copyFileSync(wal, this.appDataDbPath + '-wal');
                if (fs.existsSync(shm)) fs.copyFileSync(shm, this.appDataDbPath + '-shm');
            } catch (err) {
                console.error('Failed to migrate exe DB to AppData fallback:', err);
            }
        }

        // Refresh existence checks after migration/copy steps above.
        primaryExists = fs.existsSync(this.primaryDbPath);
        oldPrimaryExists = fs.existsSync(this.oldPrimaryDbPath);

        // Priority 1: Primary database exists
        if (!this.db && primaryExists) {
            console.log('Using existing primary database at', this.primaryDbPath);
            this.db = new Database(this.primaryDbPath);
        }
        // Priority 2: Old named database exists - rename and use
        else if (!this.db && oldPrimaryExists) {
            console.log('Found old database, migrating to new name...');
            fs.renameSync(this.oldPrimaryDbPath, this.primaryDbPath);
            const oldWal = this.oldPrimaryDbPath + '-wal';
            const oldShm = this.oldPrimaryDbPath + '-shm';
            const newWal = this.primaryDbPath + '-wal';
            const newShm = this.primaryDbPath + '-shm';
            if (fs.existsSync(oldWal)) fs.renameSync(oldWal, newWal);
            if (fs.existsSync(oldShm)) fs.renameSync(oldShm, newShm);
            this.db = new Database(this.primaryDbPath);
            console.log('Database renamed from', OLD_DB_NAME, 'to', DB_NAME);
        }
        // Priority 3: AppData has backup but primary missing/unavailable - use AppData directly
        else if (!this.db && appDataExists) {
            console.log('Using AppData database');
            this.db = new Database(this.appDataDbPath);
        }
        // Priority 4: No database anywhere - create new
        else if (!this.db) {
            console.log('No database found - creating new at', this.primaryDbPath);
            this.db = new Database(this.primaryDbPath);
        }

        this.db.pragma('journal_mode = WAL');
    }

    /**
     * Find existing sqlite in AppData\Roaming\operation-eye (backward compatibility)
     */
    findLegacyDbInOperationEye() {
        const candidates = [
            path.join(this.legacyAppDataDir, DB_NAME),
            path.join(this.legacyAppDataDir, 'database', DB_NAME),
            path.join(this.legacyAppDataDir, OLD_DB_NAME),
        ];
        for (const p of candidates) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
        return null;
    }

    /**
     * Merge data from operation-eye legacy db into current db (backward compatibility)
     */
    mergeFromOperationEyeIfExists() {
        const legacyPath = this.findLegacyDbInOperationEye();
        if (!legacyPath) return;

        console.log('Found legacy database in operation-eye, merging for backward compatibility:', legacyPath);
        let legacyDb;
        try {
            legacyDb = new Database(legacyPath, { readonly: true });
        } catch (err) {
            console.error('Could not open legacy database for merge:', err);
            return;
        }

        try {
            const patients = this.safeQueryAll(legacyDb, 'SELECT * FROM patients WHERE deletedAt IS NULL');
            const operations = this.safeQueryAll(legacyDb, 'SELECT * FROM operations WHERE deletedAt IS NULL');
            const iolModels = this.safeQueryAll(legacyDb, 'SELECT * FROM iol_models WHERE deletedAt IS NULL');

            if (patients.length === 0 && operations.length === 0 && iolModels.length === 0) {
                console.log('Legacy database is empty, nothing to merge');
                return;
            }

            const db = this.db;
            const run = db.transaction(() => {
                db.pragma('foreign_keys = OFF');
                try {
                    const localPatients = new Map(
                        db.prepare('SELECT id, updatedAt FROM patients WHERE deletedAt IS NULL').all().map(p => [p.id, p.updatedAt])
                    );
                    const localOperations = new Map(
                        db.prepare('SELECT id, updatedAt FROM operations WHERE deletedAt IS NULL').all().map(o => [o.id, o.updatedAt])
                    );
                    const localModels = new Map(
                        db.prepare('SELECT id, updatedAt FROM iol_models WHERE deletedAt IS NULL').all().map(m => [m.id, m.updatedAt])
                    );

                    const shouldMerge = (localUtc, peerUtc) => {
                        if (!peerUtc) return false;
                        if (!localUtc) return true;
                        return peerUtc > localUtc;
                    };

                    if (patients.length) {
                        const insert = db.prepare(`
                            INSERT OR REPLACE INTO patients (id, name, dateOfBirth, gender, createdAt, updatedAt, deletedAt)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `);
                        for (const p of patients) {
                            const localUtc = localPatients.get(p.id);
                            if (!localUtc || shouldMerge(localUtc, p.updatedAt)) {
                                insert.run(p.id, p.name, p.dateOfBirth, p.gender, p.createdAt, p.updatedAt, p.deletedAt);
                            }
                        }
                        console.log('Merged', patients.length, 'patients from operation-eye');
                    }

                    if (operations.length && operations[0]) {
                        const opCols = Object.keys(operations[0]).filter(k => k !== 'patientName');
                        const placeholders = opCols.map(() => '?').join(', ');
                        const insert = db.prepare(`INSERT OR REPLACE INTO operations (${opCols.join(', ')}) VALUES (${placeholders})`);
                        for (const o of operations) {
                            const localUtc = localOperations.get(o.id);
                            if (!localUtc || shouldMerge(localUtc, o.updatedAt)) {
                                insert.run(...opCols.map(c => o[c] ?? null));
                            }
                        }
                        console.log('Merged', operations.length, 'operations from operation-eye');
                    }

                    if (iolModels.length) {
                        const insert = db.prepare(`
                            INSERT OR REPLACE INTO iol_models (id, name, isDefault, createdAt, updatedAt, deletedAt)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `);
                        for (const m of iolModels) {
                            const localUtc = localModels.get(m.id);
                            if (!localUtc || shouldMerge(localUtc, m.updatedAt)) {
                                try {
                                    insert.run(m.id, m.name, m.isDefault || 0, m.createdAt, m.updatedAt, m.deletedAt);
                                } catch (err) {
                                    if (err.message?.includes('UNIQUE') && err.message?.includes('name')) {
                                        const byName = db.prepare('SELECT id, updatedAt FROM iol_models WHERE name = ? AND deletedAt IS NULL').get(m.name);
                                        if (byName && shouldMerge(byName.updatedAt, m.updatedAt)) {
                                            db.prepare('UPDATE iol_models SET isDefault=?, updatedAt=? WHERE id=?').run(m.isDefault || 0, m.updatedAt, byName.id);
                                        }
                                    } else throw err;
                                }
                            }
                        }
                        console.log('Merged', iolModels.length, 'IOL models from operation-eye');
                    }
                } finally {
                    db.pragma('foreign_keys = ON');
                }
            });
            run();
            this.fallbackBackup();
            console.log('Legacy operation-eye database merged successfully');
        } catch (err) {
            console.error('Failed to merge legacy database:', err);
        } finally {
            try { legacyDb.close(); } catch (_) {}
        }
    }

    safeQueryAll(db, sql) {
        try {
            return db.prepare(sql).all();
        } catch {
            return [];
        }
    }

    backupToAppData() {
        // When primary is already in AppData, no need to backup to same path
        if (this.primaryDbPath === this.appDataDbPath) return;
        // Run sync backup first to ensure backup exists immediately in AppData\Roaming\SmartIOL
        this.fallbackBackup();
        // Then run async backup for a clean copy (handles WAL properly)
        try {
            this.db.backup(this.appDataDbPath)
                .then(() => {
                    console.log('Database backed up to AppData (SmartIOL) successfully');
                })
                .catch((err) => {
                    console.error('Async backup failed (sync backup already done):', err);
                });
        } catch (err) {
            console.error('Backup error:', err);
        }
    }

    fallbackBackup() {
        try {
            this.db.pragma('wal_checkpoint(TRUNCATE)');
            if (this.primaryDbPath !== this.appDataDbPath) {
                fs.copyFileSync(this.primaryDbPath, this.appDataDbPath);
                console.log('Database backed up using file copy');
            }
        } catch (err) {
            console.error('Fallback backup failed:', err);
        }
    }

    setupTables() {
        // Schema version table for tracking migrations
        // Drop and recreate if structure is wrong
        try {
            const columns = this.db.pragma('table_info(schema_version)');
            const hasIdColumn = columns.some(col => col.name === 'id');
            if (columns.length > 0 && !hasIdColumn) {
                console.log('Recreating schema_version table with correct structure');
                this.db.exec('DROP TABLE schema_version');
            }
        } catch (err) {
            // Table doesn't exist, that's fine
        }
        
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS schema_version (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                version INTEGER NOT NULL,
                updatedAt TEXT NOT NULL
            )
        `);

        // Patients table
        this.db.exec(`
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

        // Operations table - clean schema with CSO machine data
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS operations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                
                -- General Information
                operationDate TEXT,
                patientId INTEGER NOT NULL,
                age INTEGER,
                eye TEXT NOT NULL,
                
                -- Notes
                noteSistemic TEXT,
                noteEye TEXT,
                noteIOLType TEXT,
                
                -- BCDVA
                bcdva_sph TEXT,
                bcdva_cyl TEXT,
                bcdva_ax TEXT,
                bcdva_va TEXT,
                
                -- Ocular Parameters
                refSf TEXT,
                target TEXT,
                offsetLimbus TEXT,
                offsetPupilla TEXT,
                AbS TEXT,
                Coma TEXT,
                HOA TEXT,
                SDP TEXT,
                SRI TEXT,
                SAI TEXT,
                Q TEXT,
                pupillaPhotopic TEXT,
                pupillaMesopica TEXT,
                pupillaScotopic TEXT,
                cellEndotelio TEXT,
                
                -- Corneal Measurements
                centralThk TEXT,
                minThk TEXT,
                epitThk TEXT,
                Kmax TEXT,
                WtoW TEXT,
                LtoL TEXT,
                SS TEXT,
                
                -- CSO Keratometry
                cso_K1 TEXT,
                cso_axK1 TEXT,
                cso_K2 TEXT,
                cso_axK2 TEXT,
                cso_avgKm TEXT,
                cso_cil TEXT,
                cso_ax TEXT,
                cilTotal TEXT,
                axConclusion TEXT,
                
                -- CSO Biometry
                cso_AXL TEXT,
                cso_ACD TEXT,
                cso_LT TEXT,
                
                -- IOL Sferica (EVO 2.0, Hoffer QST, Kane, PEARL-DGS)
                iol_evo2 TEXT,
                iol_evo2_res TEXT,
                iol_hoffer_qst TEXT,
                iol_hoffer_qst_res TEXT,
                iol_kane TEXT,
                iol_kane_res TEXT,
                iol_pearl_dgs TEXT,
                iol_pearl_dgs_res TEXT,
                
                -- IOL Torica (EVO Toric, Hoffer QST Toric, Kane Toric)
                iol_evo_toric TEXT,
                iol_evo_toric_pwr TEXT,
                iol_evo_toric_res TEXT,
                iol_evo_toric_rescyl TEXT,
                iol_hoffer_qst_toric TEXT,
                iol_hoffer_qst_toric_pwr TEXT,
                iol_hoffer_qst_toric_res TEXT,
                iol_hoffer_qst_toric_rescyl TEXT,
                iol_kane_toric TEXT,
                iol_kane_toric_pwr TEXT,
                iol_kane_toric_res TEXT,
                iol_kane_toric_rescyl TEXT,
                
                -- IOL Post LVC (EVO 2.0, PEARL-DGS, Ray Tracing)
                iol_evo2_post TEXT,
                iol_evo2_post_res TEXT,
                iol_pearl_dgs_post TEXT,
                iol_pearl_dgs_post_res TEXT,
                iol_ray_tracing TEXT,
                iol_ray_tracing_res TEXT,
                
                -- IOL Model Selected
                iolModelSelected TEXT,
                
                -- Linked Operation (for OU - both eyes cases)
                linkedOperationId INTEGER NULL,
                
                -- Metadata
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                deletedAt TEXT NULL,
                
                FOREIGN KEY (patientId) REFERENCES patients(id),
                FOREIGN KEY (linkedOperationId) REFERENCES operations(id)
            )
        `);

        // IOL Models table - stores custom IOL brand/models
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS iol_models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                isDefault INTEGER NOT NULL DEFAULT 0,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                deletedAt TEXT NULL
            )
        `);

        console.log('Database tables setup complete');
    }

    getCurrentVersion() {
        try {
            const row = this.db.prepare('SELECT version FROM schema_version WHERE id = 1').get();
            return row ? row.version : 0;
        } catch (err) {
            return 0;
        }
    }

    setVersion(version) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO schema_version (id, version, updatedAt) 
            VALUES (1, ?, ?)
        `);
        stmt.run(version, new Date().toISOString());
    }

    /**
     * Run schema migrations - updates table structure while preserving existing data.
     * Uses ALTER TABLE ADD COLUMN (non-destructive) so user data is maintained when
     * they upgrade to a new exe version.
     */
    runMigrations() {
        const currentVersion = this.getCurrentVersion();
        console.log('Current database version:', currentVersion);
        console.log('Target database version:', DB_VERSION);

        if (currentVersion >= DB_VERSION) {
            console.log('Database is up to date');
            return;
        }

        // Run migrations in a transaction
        const runMigration = this.db.transaction(() => {
            // Migration 1: Add linkedOperationId column
            if (currentVersion < 1) {
                console.log('Running migration 1: Adding linkedOperationId column');
                const columns = this.db.pragma('table_info(operations)');
                const hasLinkedOperationId = columns.some(col => col.name === 'linkedOperationId');
                
                if (!hasLinkedOperationId) {
                    this.db.exec('ALTER TABLE operations ADD COLUMN linkedOperationId INTEGER NULL');
                }
                this.setVersion(1);
            }

            // Migration 2: Auto-link existing OU operations by same patient and date
            if (currentVersion < 2) {
                console.log('Running migration 2: Auto-linking existing both-eyes operations');
                this.autoLinkBothEyesOperations();
                this.setVersion(2);
            }

            // Migration 3: Add IOL models table with default models
            if (currentVersion < 3) {
                console.log('Running migration 3: Setting up IOL models table');
                this.seedDefaultIolModels();
                this.setVersion(3);
            }

            if (currentVersion < 4) {
                console.log('Running migration 4: FileMaker valutazione columns');
                this.addValutazioneColumns();
                this.migrateLegacyIolResiduals();
                this.setVersion(4);
            }

            if (currentVersion < 5) {
                console.log('Running migration 5: FileMaker IOL model list');
                this.seedDefaultIolModels(true);
                this.setVersion(5);
            }

            if (currentVersion < 6) {
                console.log('Running migration 6: Native IOL calculator fields');
                this.addNativeCalculatorColumns();
                this.setVersion(6);
            }
        });

        try {
            runMigration();
            console.log('All migrations completed successfully');
            // Sync backup to AppData after migrations - ensures user data persists with updated schema
            this.fallbackBackup();
        } catch (err) {
            console.error('Migration failed:', err);
            throw err;
        }
    }

    // Auto-link operations for same patient on same date with OD/OS
    autoLinkBothEyesOperations() {
        // Find pairs of OD/OS operations for the same patient on the same date
        const pairs = this.db.prepare(`
            SELECT 
                od.id as odId, 
                os.id as osId
            FROM operations od
            INNER JOIN operations os ON 
                od.patientId = os.patientId 
                AND od.operationDate = os.operationDate
                AND od.eye = 'OD' 
                AND os.eye = 'OS'
                AND od.deletedAt IS NULL 
                AND os.deletedAt IS NULL
                AND od.linkedOperationId IS NULL
                AND os.linkedOperationId IS NULL
                AND od.id != os.id
        `).all();

        console.log(`Found ${pairs.length} pairs to link`);

        const updateStmt = this.db.prepare(`
            UPDATE operations SET linkedOperationId = ? WHERE id = ?
        `);

        for (const pair of pairs) {
            // Link OD -> OS
            updateStmt.run(pair.osId, pair.odId);
            // Link OS -> OD
            updateStmt.run(pair.odId, pair.osId);
            console.log(`Linked operations: OD(${pair.odId}) <-> OS(${pair.osId})`);
        }
    }

    addValutazioneColumns() {
        const newCols = [
            'interventoDi', 'costo', 'noteIntervento', 'contralateralEye',
            'tomey_avgKm', 'tomey_cilTotal', 'tomey_cil', 'tomey_ax', 'tomey_AXL', 'tomey_ACD', 'tomey_LT',
            'argos_avgKm', 'argos_cilTotal', 'argos_cil', 'argos_ax', 'argos_AXL', 'argos_ACD', 'argos_LT',
            'iol_argos_barrett_res', 'iol_tomey_barrett_res',
            'iol_argos_barrett_toric_res', 'iol_argos_barrett_toric_t', 'iol_argos_barrett_toric_axis',
            'iol_tomey_barrett_toric_res', 'iol_tomey_barrett_toric_t', 'iol_tomey_barrett_toric_axis',
            'iol_argos_barrett_tk_res', 'iol_tomey_barrett_tk_res', 'iol_tomey_oculix_res',
            'tunnel', 'iolT', 'iolAx', 'iolPower',
        ];
        const existing = new Set(this.db.pragma('table_info(operations)').map((c) => c.name));
        for (const col of newCols) {
            if (!existing.has(col)) {
                this.db.exec(`ALTER TABLE operations ADD COLUMN ${col} TEXT`);
            }
        }
    }

    addNativeCalculatorColumns() {
        const newCols = [
            'iolCalcFormula', 'iolCalcAConstant', 'iolCalcSurgeonFactor',
            'iolCalcA0', 'iolCalcA1', 'iolCalcA2',
            'iolCalcRecommendedPower', 'iolCalcPredictedResidual',
            'iolCalcKUsed', 'iolCalcAlUsed', 'iolCalcAcdUsed',
        ];
        const existing = new Set(this.db.pragma('table_info(operations)').map((c) => c.name));
        for (const col of newCols) {
            if (!existing.has(col)) {
                this.db.exec(`ALTER TABLE operations ADD COLUMN ${col} TEXT`);
            }
        }
    }

    migrateLegacyIolResiduals() {
        // Copy existing CSO power fields into residual columns where residual empty
        const pairs = [
            ['iol_evo2', 'iol_evo2_res'],
            ['iol_hoffer_qst', 'iol_hoffer_qst_res'],
            ['iol_kane', 'iol_kane_res'],
            ['iol_pearl_dgs', 'iol_pearl_dgs_res'],
        ];
        for (const [pwr, res] of pairs) {
            this.db.prepare(`
                UPDATE operations SET ${res} = ${pwr}
                WHERE (${res} IS NULL OR ${res} = '') AND ${pwr} IS NOT NULL AND ${pwr} != ''
            `).run();
        }
    }

    // Seed default IOL models (FileMaker valutazione list)
    seedDefaultIolModels(forceAll = false) {
        const defaultModels = [
            'Alcon MA60MA (+/-5)',
            'Alcon MA60AC',
            'Alcon SA60AT',
            'Alcon SN60WF',
            'Alcon SN6AT',
            'Alcon Clareon',
            'Alcon Clareon T',
            'Alcon Vivity',
            'Alcon Vivity T',
            'Alcon Panoptix',
            'Alcon Panoptix T',
            'J&J Eyhance',
            'J&J Eyhance T',
            'J&J Puresee',
            'Luxsmart',
            'Luxsmart T',
            'Sifi Evolux',
            'Artisan',
            'Artiflex',
            'IPCL',
            'ICL',
            'BVI isopure serenity',
        ];

        const now = new Date().toISOString();
        const insertStmt = this.db.prepare(`
            INSERT OR IGNORE INTO iol_models (name, isDefault, createdAt, updatedAt)
            VALUES (?, 1, ?, ?)
        `);

        for (const model of defaultModels) {
            if (forceAll) {
                const exists = this.db.prepare(
                    'SELECT id FROM iol_models WHERE name = ? AND deletedAt IS NULL',
                ).get(model);
                if (!exists) insertStmt.run(model, now, now);
            } else {
                insertStmt.run(model, now, now);
            }
        }

        console.log(`Seeded ${defaultModels.length} default IOL models`);
    }

    // Manual backup method (can be called from UI)
    createBackup() {
        this.backupToAppData();
    }

    // Get database info for debugging
    getDatabaseInfo() {
        return {
            primaryPath: this.primaryDbPath,
            backupPath: this.appDataDbPath,
            userDataPath: app.getPath('userData'),
            legacyOperationEyePath: this.legacyAppDataDir,
            legacyDbFound: !!this.findLegacyDbInOperationEye(),
            version: this.getCurrentVersion(),
            primaryExists: fs.existsSync(this.primaryDbPath),
            backupExists: fs.existsSync(this.appDataDbPath)
        };
    }

    getConnection() {
        return this.db;
    }

    // Close database properly
    close() {
        if (this.db) {
            // Final backup before closing
            this.fallbackBackup();
            this.db.close();
        }
    }
}

export default AppDatabase;
