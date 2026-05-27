import { ref } from 'vue';
import defaultOcularParameterRules from '@/config/ocularParameterRules.json';

// Reactive ocular parameter rules state (shared across all components)
const ocularParameterRules = ref(JSON.parse(JSON.stringify(defaultOcularParameterRules)));
const isLoaded = ref(false);

/**
 * Composable for accessing and managing ocular parameter rules configuration
 * The rules are loaded from the user's AppData config if available,
 * falling back to bundled defaults
 */
export function useFieldRules() {
    /**
     * Load ocular parameter rules from the config API
     * Falls back to bundled defaults if API unavailable
     */
    async function loadFieldRules() {
        try {
            if (window.api?.config?.get) {
                const result = await window.api.config.get();
                if (result && result.success && result.data) {
                    // Deep clone to ensure reactivity works properly
                    ocularParameterRules.value = JSON.parse(JSON.stringify(result.data));
                    isLoaded.value = true;
                    return;
                }
            }
        } catch (error) {
            console.warn('Failed to load config from API, using defaults:', error);
        }
        // Fallback to defaults
        ocularParameterRules.value = JSON.parse(JSON.stringify(defaultOcularParameterRules));
        isLoaded.value = true;
    }

    /**
     * Get config for a specific field
     */
    function getFieldConfig(source, field) {
        return ocularParameterRules.value[source]?.[field] || null;
    }

    /**
     * Check if a value is in the green (normal) range
     */
    function isInGreenRange(source, field, value) {
        const config = getFieldConfig(source, field);
        if (!config?.green) return true;
        
        const num = parseFloat(value);
        if (isNaN(num)) return true;
        
        const { min, max } = config.green;
        const aboveMin = min === undefined || num >= min;
        const belowMax = max === undefined || num <= max;
        return aboveMin && belowMax;
    }

    /**
     * Check if a value is in a yellow (warning) range
     */
    function isInYellowRange(source, field, value) {
        const config = getFieldConfig(source, field);
        if (!config?.yellow || !Array.isArray(config.yellow)) return false;
        
        const num = parseFloat(value);
        if (isNaN(num)) return false;
        
        return config.yellow.some(range => num >= range.min && num <= range.max);
    }

    return {
        fieldRules: ocularParameterRules, // Keep fieldRules for backward compatibility
        ocularParameterRules,
        isLoaded,
        loadFieldRules,
        getFieldConfig,
        isInGreenRange,
        isInYellowRange
    };
}
