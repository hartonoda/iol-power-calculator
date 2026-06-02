import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const DB_NAME = 'iol-calculator-patient-data.sqlite';
const LEGACY_DB_NAMES = ['patient_data.sqlite', 'operation-eye.sqlite'];
const DB_VERSION = 8; // Increment this when adding new migrations

// Legacy folder for backward compatibility (old app used operation-eye)
const LEGACY_APP_DATA = 'operation-eye';

class AppDatabase {
    constructor() {
        // AppData\Roaming\SmartIOL\database - backup location (userData = SmartIOL from productName)
        this.appDataPath = path.join(app.getPath('userData'), 'database');
        this.appDataDbPath = path.join(this.appDataPath, DB_NAME);
        this.appDataLegacyDbPaths = LEGACY_DB_NAMES.map((name) => path.join(this.appDataPath, name));

        // Exe folder path (Program Files is read-only - we must use AppData there)
        this.exeDbPath = process.env.NODE_ENV === 'development'
            ? path.join(app.getAppPath(), DB_NAME)
            : path.join(path.dirname(process.execPath), DB_NAME);
        this.exeLegacyDbPaths = LEGACY_DB_NAMES.map((name) => (
            process.env.NODE_ENV === 'development'
                ? path.join(app.getAppPath(), name)
                : path.join(path.dirname(process.execPath), name)
        ));

        // Primary database preference:
        // - Use exe folder database as the main working DB when writable.
        // - Use AppData only as backup (and as fallback when exe folder is not writable).
        this.exeFolderWritable = this.checkExeFolderWritable();
        this.primaryDbPath = this.exeFolderWritable ? this.exeDbPath : this.appDataDbPath;

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

    copyDbFamily(src, dst) {
        fs.copyFileSync(src, dst);
        const srcWal = src + '-wal';
        const srcShm = src + '-shm';
        if (fs.existsSync(srcWal)) fs.copyFileSync(srcWal, dst + '-wal');
        if (fs.existsSync(srcShm)) fs.copyFileSync(srcShm, dst + '-shm');
    }

    renameDbFamily(src, dst) {
        const moveOrCopy = (from, to) => {
            try {
                fs.renameSync(from, to);
            } catch (err) {
                // If locked (EBUSY/EPERM), fallback to copy to avoid startup failure.
                if (err.code === 'EBUSY' || err.code === 'EPERM') {
                    fs.copyFileSync(from, to);
                } else {
                    throw err;
                }
            }
        };
        moveOrCopy(src, dst);
        const srcWal = src + '-wal';
        const srcShm = src + '-shm';
        if (fs.existsSync(srcWal)) moveOrCopy(srcWal, dst + '-wal');
        if (fs.existsSync(srcShm)) moveOrCopy(srcShm, dst + '-shm');
    }

    firstExisting(paths) {
        return paths.find((p) => fs.existsSync(p)) || null;
    }

    normalizeLegacyDbNames() {
        const appDataLegacy = this.firstExisting(this.appDataLegacyDbPaths);
        if (!fs.existsSync(this.appDataDbPath) && appDataLegacy) {
            console.log('Migrating legacy AppData DB name:', appDataLegacy);
            this.renameDbFamily(appDataLegacy, this.appDataDbPath);
        }
        if (this.exeFolderWritable) {
            const exeLegacy = this.firstExisting(this.exeLegacyDbPaths);
            if (!fs.existsSync(this.exeDbPath) && exeLegacy) {
                console.log('Migrating legacy exe DB name:', exeLegacy);
                this.renameDbFamily(exeLegacy, this.exeDbPath);
            }
        }
    }

    initializeDatabase() {
        this.normalizeLegacyDbNames();

        let primaryExists = fs.existsSync(this.primaryDbPath);
        const appDataExists = fs.existsSync(this.appDataDbPath);

        console.log('Database check:', {
            primaryExists,
            appDataExists,
            exeFolderWritable: this.exeFolderWritable,
            primaryPath: this.primaryDbPath,
            appDataPath: this.appDataDbPath
        });

        if (this.exeFolderWritable) {
            // SmartIOL-like behavior:
            // 1) If AppData DB exists and exe DB does not, copy AppData -> exe.
            // 2) If AppData DB does not exist, create fresh DB in exe folder.
            if (!primaryExists && appDataExists) {
                console.log('AppData DB found and exe DB missing - restoring backup to exe folder');
                try {
                    this.copyDbFamily(this.appDataDbPath, this.primaryDbPath);
                    primaryExists = true;
                } catch (err) {
                    console.error('Failed to copy AppData backup to exe DB:', err);
                }
            } else if (!primaryExists) {
                console.log('No AppData backup found - exe DB will be created fresh');
            } else {
                console.log('Exe DB exists - skipping startup restore from AppData');
            }
        } else {
            // Fallback only when exe folder is not writable.
            if (!primaryExists && appDataExists) {
                primaryExists = true;
            } else if (!primaryExists) {
                const legacyExe = this.firstExisting([this.exeDbPath, ...this.exeLegacyDbPaths]);
                if (legacyExe) {
                    console.log('Exe folder not writable - seeding AppData DB from exe DB');
                    this.copyDbFamily(legacyExe, this.appDataDbPath);
                    primaryExists = true;
                }
            }
        }

        primaryExists = fs.existsSync(this.primaryDbPath);
        const appDataNowExists = fs.existsSync(this.appDataDbPath);

        if (this.exeFolderWritable && primaryExists) {
            console.log('Using existing primary database at', this.primaryDbPath);
            this.db = new Database(this.primaryDbPath);
        } else if (appDataNowExists) {
            console.log('Using AppData database');
            this.db = new Database(this.appDataDbPath);
        } else {
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
            ...LEGACY_DB_NAMES.flatMap((name) => ([
                path.join(this.legacyAppDataDir, name),
                path.join(this.legacyAppDataDir, 'database', name),
            ])),
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
                compat_monofocale_standard TEXT,
                compat_monofocale_plus TEXT,
                compat_edof TEXT,
                compat_multifocal TEXT,
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
                this.setVersion(6);
            }

            if (currentVersion < 7) {
                console.log('Running migration 7: Compatibility score fields');
                this.addCompatibilityScoreColumns();
                this.setVersion(7);
            }

            if (currentVersion < 8) {
                // Keep compatibility columns idempotent in case of version drift
                console.log('Running migration 8: Ensure compatibility score columns');
                this.addCompatibilityScoreColumns();
                this.setVersion(8);
            }

            if (currentVersion < 9) {
                console.log('Running migration 9: Endothelial cell note field');
                this.addCellEndotelioNoteColumn();
                this.setVersion(9);
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

    addCompatibilityScoreColumns() {
        const newCols = [
            'compat_monofocale_standard',
            'compat_monofocale_plus',
            'compat_edof',
            'compat_multifocal',
        ];
        const existing = new Set(this.db.pragma('table_info(operations)').map((c) => c.name));
        for (const col of newCols) {
            if (!existing.has(col)) {
                this.db.exec(`ALTER TABLE operations ADD COLUMN ${col} TEXT`);
            }
        }
    }

    addCellEndotelioNoteColumn() {
        const existing = new Set(this.db.pragma('table_info(operations)').map((c) => c.name));
        if (!existing.has('cellEndotelioNote')) {
            this.db.exec('ALTER TABLE operations ADD COLUMN cellEndotelioNote TEXT');
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
        const smartIolDbPath = this.getSmartIolDbPath();
        return {
            primaryPath: this.primaryDbPath,
            backupPath: this.appDataDbPath,
            userDataPath: app.getPath('userData'),
            legacyOperationEyePath: this.legacyAppDataDir,
            legacyDbFound: !!this.findLegacyDbInOperationEye(),
            smartIolDbPath,
            smartIolDbFound: !!smartIolDbPath,
            version: this.getCurrentVersion(),
            primaryExists: fs.existsSync(this.primaryDbPath),
            backupExists: fs.existsSync(this.appDataDbPath)
        };
    }

    getSmartIolDbPath() {
        const smartIolDir = path.join(app.getPath('appData'), 'SmartIOL', 'database');
        const names = [DB_NAME, ...LEGACY_DB_NAMES];
        for (const name of names) {
            const p = path.join(smartIolDir, name);
            if (fs.existsSync(p)) return p;
        }
        return null;
    }

    listSmartIolPatients(search = '') {
        const dbPath = this.getSmartIolDbPath();
        if (!dbPath) return [];
        let extDb;
        try {
            extDb = new Database(dbPath, { readonly: true });
            const term = `%${String(search || '').trim()}%`;
            return extDb.prepare(`
                SELECT id, name, dateOfBirth, gender
                FROM patients
                WHERE deletedAt IS NULL
                  AND (? = '%%' OR name LIKE ? COLLATE NOCASE)
                ORDER BY name ASC
                LIMIT 500
            `).all(term, term);
        } catch (err) {
            console.error('Failed to list SmartIOL patients:', err);
            return [];
        } finally {
            if (extDb) {
                try { extDb.close(); } catch (_) {}
            }
        }
    }

    listSmartIolOperationsByPatientId(patientId) {
        const dbPath = this.getSmartIolDbPath();
        if (!dbPath || !patientId) return [];
        let extDb;
        try {
            extDb = new Database(dbPath, { readonly: true });
            return extDb.prepare(`
                SELECT *
                FROM operations
                WHERE patientId = ?
                  AND deletedAt IS NULL
                ORDER BY operationDate DESC, id DESC
            `).all(patientId);
        } catch (err) {
            console.error('Failed to list SmartIOL operations:', err);
            return [];
        } finally {
            if (extDb) {
                try { extDb.close(); } catch (_) {}
            }
        }
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
