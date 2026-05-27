import { ref } from 'vue';
import defaultIOLRules from '@/config/iolSuitabilityRules.json';

// Reactive IOL rules state (shared across all components)
const iolRules = ref(JSON.parse(JSON.stringify(defaultIOLRules)));
const isLoaded = ref(false);

/**
 * Composable for accessing and managing IOL suitability rules configuration
 * The rules are loaded from the user's AppData config if available,
 * falling back to bundled defaults
 */
export function useIOLRules() {
    /**
     * Load IOL rules from the config API
     * Falls back to bundled defaults if API unavailable
     */
    async function loadIOLRules() {
        try {
            if (window.api?.iolRules?.get) {
                const result = await window.api.iolRules.get();
                if (result && result.success && result.data) {
                    // Deep clone to ensure reactivity works properly
                    iolRules.value = JSON.parse(JSON.stringify(result.data));
                    isLoaded.value = true;
                    return;
                }
            }
        } catch (error) {
            console.warn('Failed to load IOL rules from API, using defaults:', error);
        }
        // Fallback to defaults
        iolRules.value = JSON.parse(JSON.stringify(defaultIOLRules));
        isLoaded.value = true;
    }

    /**
     * Get score deductions
     */
    function getScoreDeductions() {
        return iolRules.value.scoreDeductions || {};
    }

    /**
     * Get config for a specific parameter
     */
    function getParamConfig(paramName) {
        return iolRules.value.scoreDeductions?.[paramName] || null;
    }

    /**
     * Get all parameter names
     */
    function getParamNames() {
        const deductions = iolRules.value.scoreDeductions;
        if (!deductions) return [];
        return Object.keys(deductions).filter(key => key !== 'description');
    }

    return {
        iolRules,
        isLoaded,
        loadIOLRules,
        getScoreDeductions,
        getParamConfig,
        getParamNames
    };
}
