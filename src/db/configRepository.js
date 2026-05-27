import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const CONFIG_FILENAME = 'ocularParameterRules.json';

// Embedded default config as fallback when file cannot be found
const DEFAULT_CONFIG = {
  "eyeInfo": {
    "offsetLimbus": { "label": "Offset Limbus", "green": { "max": 0.3 }, "yellow": [{ "min": 0.31, "max": 0.5 }] },
    "offsetPupilla": { "label": "Offset Pupil", "green": { "max": 0.2 }, "yellow": [{ "min": 0.21, "max": 0.4 }] },
    "SDP": { "label": "SDP", "green": { "max": 1.2 }, "yellow": [{ "min": 1.21, "max": 1.4 }] },
    "SRI": { "label": "SRI", "green": { "max": 0.7 }, "yellow": [{ "min": 0.71, "max": 0.9 }] },
    "SAI": { "label": "SAI", "green": { "max": 0.55 }, "yellow": [{ "min": 0.56, "max": 0.62 }] },
    "AbS": { "label": "Spherical Aberration", "green": { "max": 0.1 }, "yellow": [{ "min": 0.11, "max": 0.2 }] },
    "Coma": { "label": "Coma Aberration", "green": { "max": 0.2 }, "yellow": [{ "min": 0.21, "max": 0.3 }] },
    "HOA": { "label": "Higher Order Aberrations", "green": { "max": 0.25 }, "yellow": [{ "min": 0.26, "max": 0.4 }] },
    "pupillaPhotopic": { "label": "Photopic Pupil Diameter", "green": { "max": 3.5 }, "yellow": [{ "min": 3.51, "max": 4 }] },
    "pupillaMesopica": { "label": "Mesopic Pupil Diameter", "green": { "max": 5 }, "yellow": [{ "min": 5.01, "max": 5.5 }] },
    "pupillaScotopic": { "label": "Scotopic Pupil Diameter", "green": { "max": 6 }, "yellow": [{ "min": 6.01, "max": 6.5 }] }
  },
  "machine": {
    "K1": { "label": "Keratometry 1 (Flat)", "shortLabel": "K1 Flat", "green": { "min": 41, "max": 45 }, "yellow": [{ "min": 40, "max": 40.9 }, { "min": 45.1, "max": 46 }] },
    "axK1": { "label": "K1 Axis", "shortLabel": "K1 Axis", "green": { "min": 0, "max": 180 }, "yellow": null },
    "cellEndotelio": { "label": "Endothelial Cell Count", "shortLabel": "Endothelial", "green": { "min": 2000 }, "yellow": [{ "min": 1500, "max": 1999 }] },
    "K2": { "label": "Keratometry 2 (Steep)", "shortLabel": "K2 Steep", "green": { "min": 42, "max": 46 }, "yellow": [{ "min": 41, "max": 41.9 }, { "min": 46.1, "max": 47 }] },
    "avgKm": { "label": "Average Keratometry", "shortLabel": "Avg Km", "green": { "min": 41.5, "max": 45 }, "yellow": [{ "min": 40.5, "max": 41.4 }, { "min": 45.1, "max": 46.5 }] },
    "AXL": { "label": "Axial Length", "shortLabel": "Axial Len", "green": { "min": 21.5, "max": 24.5 }, "yellow": [{ "min": 21, "max": 21.4 }, { "min": 24.6, "max": 26 }] },
    "ACD": { "label": "Anterior Chamber Depth", "shortLabel": "AC Depth", "green": { "min": 2.8, "max": 3.5 }, "yellow": [{ "min": 2.5, "max": 2.79 }, { "min": 3.51, "max": 4 }] },
    "LT": { "label": "Lens Thickness", "shortLabel": "Lens Thk", "green": { "min": 4, "max": 4.89 }, "yellow": [{ "min": 3.5, "max": 3.99 }, { "min": 4.9, "max": 5.5 }] }
  }
};

class ConfigRepository {
    constructor() {
        // AppData config path - SmartIOL folder (userData = SmartIOL from productName)
        this.appDataPath = path.join(app.getPath('userData'), 'config');
        this.appDataConfigPath = path.join(this.appDataPath, CONFIG_FILENAME);
        
        // Bundled config path - try multiple locations
        const isDev = !app.isPackaged;
        
        // Possible paths for bundled config
        const possiblePaths = isDev
            ? [
                // Development paths
                path.join(app.getAppPath(), 'src', 'config', CONFIG_FILENAME)
              ]
            : [
                // Production paths - extraResource copies to resources folder
                path.join(process.resourcesPath, CONFIG_FILENAME),
                // Fallback paths
                path.join(process.resourcesPath, 'app', 'src', 'config', CONFIG_FILENAME),
                path.join(app.getAppPath(), 'src', 'config', CONFIG_FILENAME)
              ];
        
        // Find first existing path
        this.bundledConfigPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
        
        console.log('Is packaged:', app.isPackaged);
        console.log('Looking for bundled config in:', possiblePaths);
        console.log('Found bundled config at:', this.bundledConfigPath);
        
        // Ensure config directory exists
        this.ensureConfigDirectory();
        
        // Don't auto-initialize - let main.js check for conflicts first
        // this.initializeConfig();
        
        console.log('Config repository ready');
        console.log('User config:', this.appDataConfigPath);
    }
    
    ensureConfigDirectory() {
        if (!fs.existsSync(this.appDataPath)) {
            fs.mkdirSync(this.appDataPath, { recursive: true });
            console.log('Created config directory:', this.appDataPath);
        }
    }
    
    /**
     * Read the bundled (default) config
     */
    readBundledConfig() {
        try {
            if (fs.existsSync(this.bundledConfigPath)) {
                const content = fs.readFileSync(this.bundledConfigPath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.error('Error reading bundled config file:', error);
        }
        
        // Fallback to embedded default config
        console.log('Using embedded default config');
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
    
    /**
     * Read user config from AppData
     */
    readUserConfig() {
        try {
            if (fs.existsSync(this.appDataConfigPath)) {
                const content = fs.readFileSync(this.appDataConfigPath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.error('Error reading user config:', error);
        }
        return null;
    }
    
    /**
     * Save config to AppData
     */
    saveUserConfig(config) {
        try {
            fs.writeFileSync(this.appDataConfigPath, JSON.stringify(config, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Error saving user config:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Deep merge two config objects
     * User values take precedence, but new fields from bundled config are added
     */
    mergeConfigs(bundled, user) {
        if (!bundled) return user;
        if (!user) return bundled;
        
        const merged = JSON.parse(JSON.stringify(bundled)); // Deep clone bundled
        
        // Iterate through sections (eyeInfo, machine)
        for (const section of Object.keys(merged)) {
            if (user[section] && typeof merged[section] === 'object') {
                // Iterate through fields in section
                for (const field of Object.keys(merged[section])) {
                    if (user[section][field]) {
                        // Merge field config - user values override
                        merged[section][field] = {
                            ...merged[section][field],
                            ...user[section][field]
                        };
                        
                        // Handle green range specially
                        if (user[section][field].green !== undefined) {
                            merged[section][field].green = user[section][field].green;
                        }
                        
                        // Handle yellow range specially
                        if (user[section][field].yellow !== undefined) {
                            merged[section][field].yellow = user[section][field].yellow;
                        }
                    }
                }
                
                // Add any user fields that don't exist in bundled (custom fields)
                for (const field of Object.keys(user[section])) {
                    if (!merged[section][field]) {
                        merged[section][field] = user[section][field];
                    }
                }
            }
        }
        
        return merged;
    }
    
    /**
     * Initialize config - merge bundled with existing user config
     */
    initializeConfig() {
        const bundled = this.readBundledConfig();
        const user = this.readUserConfig();
        
        // bundled now always returns a value (fallback to DEFAULT_CONFIG)
        if (user) {
            // Merge and update user config with any new fields from bundled
            const merged = this.mergeConfigs(bundled, user);
            this.saveUserConfig(merged);
            this.currentConfig = merged;
            console.log('Merged user config with bundled config');
        } else {
            // First run - copy bundled config to user config
            this.saveUserConfig(bundled);
            this.currentConfig = bundled;
            console.log('Created initial user config from bundled config');
        }
    }
    
    /**
     * Get the current merged config
     * Always merges with bundled config to ensure new fields are included
     */
    getConfig() {
        const bundled = this.readBundledConfig();
        const user = this.currentConfig || this.readUserConfig();
        
        if (user) {
            // Always merge to ensure new fields from bundled are included
            return this.mergeConfigs(bundled, user);
        }
        
        return bundled;
    }
    
    /**
     * Update a specific field's range
     */
    updateFieldRange(section, field, greenRange, yellowRange) {
        const config = this.getConfig();
        
        if (!config[section]) {
            return { success: false, error: `Section '${section}' not found` };
        }
        
        if (!config[section][field]) {
            return { success: false, error: `Field '${field}' not found in section '${section}'` };
        }
        
        // Update ranges
        config[section][field].green = greenRange;
        config[section][field].yellow = yellowRange;
        
        // Save and update current config
        const result = this.saveUserConfig(config);
        if (result.success) {
            this.currentConfig = config;
        }
        
        return result;
    }
    
    /**
     * Reset config to bundled defaults
     */
    resetToDefaults() {
        const bundled = this.readBundledConfig();
        if (bundled) {
            this.saveUserConfig(bundled);
            this.currentConfig = bundled;
            return { success: true };
        }
        return { success: false, error: 'Could not read bundled config' };
    }
    
    /**
     * Reset a specific field to bundled default
     */
    resetFieldToDefault(section, field) {
        const bundled = this.readBundledConfig();
        const config = this.getConfig();
        
        if (bundled?.[section]?.[field]) {
            config[section][field] = JSON.parse(JSON.stringify(bundled[section][field]));
            const result = this.saveUserConfig(config);
            if (result.success) {
                this.currentConfig = config;
            }
            return result;
        }
        
        return { success: false, error: 'Field not found in bundled config' };
    }
    
    /**
     * Compare bundled (factory) config with user (appData) config
     * Returns true if they match, false otherwise
     */
    compareConfigs() {
        const bundled = this.readBundledConfig();
        const user = this.readUserConfig();
        
        if (!user) {
            // No user config exists, so they don't match
            return false;
        }
        
        // Deep comparison by stringifying (simple but effective for JSON configs)
        return JSON.stringify(bundled) === JSON.stringify(user);
    }
    
    /**
     * Merge configs keeping user values and appending new factory parameters
     * This is used when factory has more parameters but user wants to keep their values
     */
    mergeKeepUserValues() {
        const bundled = this.readBundledConfig();
        const user = this.readUserConfig();
        
        if (!user) {
            // No user config, just use bundled
            this.saveUserConfig(bundled);
            this.currentConfig = bundled;
            return { success: true };
        }
        
        // Start with user config (keep all user values)
        const merged = JSON.parse(JSON.stringify(user));
        
        // Iterate through sections in bundled config
        for (const section of Object.keys(bundled)) {
            if (!merged[section]) {
                merged[section] = {};
            }
            
            // Iterate through fields in bundled config
            for (const field of Object.keys(bundled[section])) {
                // If field doesn't exist in user config, add it from bundled (new parameter)
                if (!merged[section][field]) {
                    merged[section][field] = JSON.parse(JSON.stringify(bundled[section][field]));
                }
                // If field exists in both, keep user value (already in merged)
            }
        }
        
        const result = this.saveUserConfig(merged);
        if (result.success) {
            this.currentConfig = merged;
        }
        return result;
    }
    
    /**
     * Use factory (bundled) config, replacing user config
     */
    useFactoryConfig() {
        const bundled = this.readBundledConfig();
        const result = this.saveUserConfig(bundled);
        if (result.success) {
            this.currentConfig = bundled;
        }
        return result;
    }
    
    /**
     * Use user (appData) config as-is
     */
    useUserConfig() {
        const user = this.readUserConfig();
        if (user) {
            this.currentConfig = user;
            return { success: true };
        }
        return { success: false, error: 'No user config found' };
    }
}

export default ConfigRepository;
