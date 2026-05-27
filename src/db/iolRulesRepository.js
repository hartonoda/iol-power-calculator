import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const CONFIG_FILENAME = 'iolSuitabilityRules.json';

// Embedded default scoreDeductions as fallback
const DEFAULT_SCORE_DEDUCTIONS = {
    "HOA": {
        "description": "Higher Order Aberrations",
        "thresholds": [
            { "condition": "greater than 0.5", "monofocaleStandard": 0, "monofocalePlus": -20, "edof": -30, "multifocal": -40 },
            { "condition": "greater than 0.3", "monofocaleStandard": 0, "monofocalePlus": -10, "edof": -15, "multifocal": -25 }
        ]
    },
    "Coma": {
        "description": "Coma aberration",
        "thresholds": [
            { "condition": "greater than 0.4", "monofocaleStandard": 0, "monofocalePlus": -15, "edof": -25, "multifocal": -35 },
            { "condition": "greater than 0.25", "monofocaleStandard": 0, "monofocalePlus": -8, "edof": -12, "multifocal": -20 }
        ]
    },
    "AbSph": {
        "description": "Spherical Aberration",
        "thresholds": [
            { "condition": "abs greater than 0.35", "monofocaleStandard": 0, "monofocalePlus": -10, "edof": -15, "multifocal": -25 },
            { "condition": "abs greater than 0.25", "monofocaleStandard": 0, "monofocalePlus": -5, "edof": -10, "multifocal": -15 }
        ]
    }
};

class IOLRulesRepository {
    constructor() {
        // AppData config path - SmartIOL folder (userData = SmartIOL from productName)
        this.appDataPath = path.join(app.getPath('userData'), 'config');
        this.appDataConfigPath = path.join(this.appDataPath, CONFIG_FILENAME);
        
        // Bundled config path - try multiple locations
        const isDev = !app.isPackaged;
        
        const possiblePaths = isDev
            ? [path.join(app.getAppPath(), 'src', 'config', CONFIG_FILENAME)]
            : [
                path.join(process.resourcesPath, CONFIG_FILENAME),
                path.join(process.resourcesPath, 'app', 'src', 'config', CONFIG_FILENAME),
                path.join(app.getAppPath(), 'src', 'config', CONFIG_FILENAME)
              ];
        
        this.bundledConfigPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
        
        console.log('IOL Rules - Found bundled config at:', this.bundledConfigPath);
        
        this.ensureConfigDirectory();
        // Don't auto-initialize - let main.js check for conflicts first
        // this.initializeConfig();
        
        console.log('IOL Rules repository ready');
    }
    
    ensureConfigDirectory() {
        if (!fs.existsSync(this.appDataPath)) {
            fs.mkdirSync(this.appDataPath, { recursive: true });
        }
    }
    
    readBundledConfig() {
        try {
            if (fs.existsSync(this.bundledConfigPath)) {
                const content = fs.readFileSync(this.bundledConfigPath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.error('Error reading bundled IOL rules:', error);
        }
        
        // Return minimal fallback structure
        return { scoreDeductions: DEFAULT_SCORE_DEDUCTIONS };
    }
    
    readUserConfig() {
        try {
            if (fs.existsSync(this.appDataConfigPath)) {
                const content = fs.readFileSync(this.appDataConfigPath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.error('Error reading user IOL rules:', error);
        }
        return null;
    }
    
    saveUserConfig(config) {
        try {
            // In development, also save to source file for convenience
            const isDev = !app.isPackaged;
            if (isDev && this.bundledConfigPath) {
                fs.writeFileSync(this.bundledConfigPath, JSON.stringify(config, null, 2));
                console.log('Saved IOL rules to source file:', this.bundledConfigPath);
            }
            
            // Always save to AppData as well
            fs.writeFileSync(this.appDataConfigPath, JSON.stringify(config, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Error saving user IOL rules:', error);
            return { success: false, error: error.message };
        }
    }
    
    mergeConfigs(bundled, user) {
        if (!bundled) return user;
        if (!user) return bundled;
        
        const merged = JSON.parse(JSON.stringify(bundled));
        
        // Merge scoreDeductions
        if (user.scoreDeductions && merged.scoreDeductions) {
            for (const param of Object.keys(merged.scoreDeductions)) {
                if (user.scoreDeductions[param]) {
                    merged.scoreDeductions[param] = user.scoreDeductions[param];
                }
            }
        }
        
        return merged;
    }
    
    initializeConfig() {
        const bundled = this.readBundledConfig();
        const user = this.readUserConfig();
        
        if (user) {
            const merged = this.mergeConfigs(bundled, user);
            this.saveUserConfig(merged);
            this.currentConfig = merged;
        } else {
            this.saveUserConfig(bundled);
            this.currentConfig = bundled;
        }
    }
    
    getConfig() {
        // In development, always read fresh from file to reflect manual edits
        const isDev = !app.isPackaged;
        if (isDev) {
            const fresh = this.readBundledConfig();
            this.currentConfig = fresh;
            return fresh;
        }
        return this.currentConfig || this.readBundledConfig();
    }
    
    getScoreDeductions() {
        const config = this.getConfig();
        return config.scoreDeductions || {};
    }
    
    updateParamThresholds(paramName, thresholds) {
        const config = this.getConfig();
        
        if (!config.scoreDeductions) {
            config.scoreDeductions = {};
        }
        
        if (!config.scoreDeductions[paramName]) {
            return { success: false, error: `Parameter '${paramName}' not found` };
        }
        
        config.scoreDeductions[paramName].thresholds = thresholds;
        
        const result = this.saveUserConfig(config);
        if (result.success) {
            this.currentConfig = config;
        }
        
        return result;
    }
    
    updateThresholdDeduction(paramName, thresholdIndex, iolType, value) {
        const config = this.getConfig();
        
        if (!config.scoreDeductions?.[paramName]?.thresholds?.[thresholdIndex]) {
            return { success: false, error: 'Threshold not found' };
        }
        
        config.scoreDeductions[paramName].thresholds[thresholdIndex][iolType] = value;
        
        const result = this.saveUserConfig(config);
        if (result.success) {
            this.currentConfig = config;
        }
        
        return result;
    }
    
    updateFullConfig(scoreDeductions) {
        const config = this.getConfig();
        config.scoreDeductions = scoreDeductions;
        
        const result = this.saveUserConfig(config);
        if (result.success) {
            this.currentConfig = config;
        }
        
        return result;
    }
    
    resetToDefaults() {
        const bundled = this.readBundledConfig();
        if (bundled) {
            this.saveUserConfig(bundled);
            this.currentConfig = bundled;
            return { success: true };
        }
        return { success: false, error: 'Could not read bundled config' };
    }
    
    resetParamToDefault(paramName) {
        const bundled = this.readBundledConfig();
        const config = this.getConfig();
        
        if (bundled?.scoreDeductions?.[paramName]) {
            config.scoreDeductions[paramName] = JSON.parse(JSON.stringify(bundled.scoreDeductions[paramName]));
            const result = this.saveUserConfig(config);
            if (result.success) {
                this.currentConfig = config;
            }
            return result;
        }
        
        return { success: false, error: 'Parameter not found in bundled config' };
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
        
        // Merge scoreDeductions - keep user values, add new from bundled
        if (bundled.scoreDeductions) {
            if (!merged.scoreDeductions) {
                merged.scoreDeductions = {};
            }
            
            for (const param of Object.keys(bundled.scoreDeductions)) {
                // If parameter doesn't exist in user config, add it from bundled (new parameter)
                if (!merged.scoreDeductions[param]) {
                    merged.scoreDeductions[param] = JSON.parse(JSON.stringify(bundled.scoreDeductions[param]));
                }
                // If parameter exists in both, keep user value (already in merged)
            }
        }
        
        // Merge other top-level properties similarly
        for (const key of Object.keys(bundled)) {
            if (key !== 'scoreDeductions' && !merged[key]) {
                merged[key] = JSON.parse(JSON.stringify(bundled[key]));
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

export default IOLRulesRepository;
