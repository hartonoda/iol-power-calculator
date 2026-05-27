import { computed } from 'vue';
import { useFieldRules } from './useFieldRules';

/**
 * Composable to collect all warnings from different sources
 * and format them for the unified warning modal
 */
export function useUnifiedWarnings() {
    const { fieldRules, isInGreenRange, isInYellowRange, getFieldConfig } = useFieldRules();

    /**
     * Collect all warnings from different sources
     * @param {Object} form - Form object with all field values
     * @param {Array} zeroCompatibilityWarnings - Zero compatibility warnings from IOLTypeSuggestionSection
     */
    const collectWarnings = (form, zeroCompatibilityWarnings = []) => {
        const warnings = {
            systemicNote: null,
            ocularNote: null,
            toricIOL: null,
            sphericalIOL: null,
            zeroCompatibility: zeroCompatibilityWarnings || [],
            endothelial: null,
            keratometry: []
        };

        // Systemic Note Warning
        if (form.noteSistemic && form.noteSistemic.trim().length > 0) {
            warnings.systemicNote = form.noteSistemic;
        }

        // Ocular Note Warning
        if (form.noteEye && form.noteEye.trim().length > 0) {
            warnings.ocularNote = form.noteEye;
        }

        // Toric IOL Warning - only show when corneal astigmatism > 0.75D
        const cilTotal = parseFloat(form.cilTotal);
        const toricIOLIndicated = !isNaN(cilTotal) && cilTotal > 0.75;
        
        const sri = parseFloat(form.SRI);
        const sriNormalMax = fieldRules.value?.eyeInfo?.SRI?.green?.max ?? 0.7;
        const sriOutOfRange = !isNaN(sri) && sri > sriNormalMax;
        
        const sai = parseFloat(form.SAI);
        const saiNormalMax = fieldRules.value?.eyeInfo?.SAI?.green?.max ?? 0.55;
        const saiOutOfRange = !isNaN(sai) && sai > saiNormalMax;

        if (toricIOLIndicated) {
            warnings.toricIOL = { cylinder: cilTotal };
            if (sriOutOfRange) {
                warnings.toricIOL.sri = {
                    value: sri,
                    max: sriNormalMax
                };
            }
            if (saiOutOfRange) {
                warnings.toricIOL.sai = {
                    value: sai,
                    max: saiNormalMax
                };
            }
        }

        // Spherical IOL Warning
        const absph = parseFloat(form.AbS);
        if (!isNaN(absph)) {
            if (absph < -0.3) {
                warnings.sphericalIOL = {
                    level: 'strong',
                    messageKey: 'iolType.sphericalIOLStrong',
                    value: absph
                };
            } else if (absph < -0.2) {
                warnings.sphericalIOL = {
                    level: 'moderate',
                    messageKey: 'iolType.sphericalIOLConsider',
                    value: absph
                };
            }
        }

        // Endothelial Warning
        const endothelialValue = parseFloat(form.cellEndotelio);
        if (!isNaN(endothelialValue)) {
            if (endothelialValue < 1500) {
                warnings.endothelial = {
                    message: 'Reduced Endothelial cell density',
                    value: endothelialValue
                };
            } else if (endothelialValue >= 1500 && endothelialValue < 2000) {
                warnings.endothelial = {
                    message: 'Mildly reduced Endothelial cell density',
                    value: endothelialValue
                };
            }
        }

        // Keratometry Warnings (outside normal range)
        const keratometryFields = [
            { field: 'K1', formField: 'cso_K1', label: 'K1 Flat', unit: ' D' },
            { field: 'K2', formField: 'cso_K2', label: 'K2 Steep', unit: ' D' },
            { field: 'avgKm', formField: 'cso_avgKm', label: 'Average Keratometry', unit: ' D' }
        ];

        for (const { field, formField, label, unit } of keratometryFields) {
            const value = parseFloat(form[formField]);
            if (!isNaN(value)) {
                const config = getFieldConfig('machine', field);
                if (config) {
                    const inGreen = isInGreenRange('machine', field, value);
                    const inYellow = isInYellowRange('machine', field, value);
                    
                    // If value is outside both green and yellow ranges, it's a warning
                    if (!inGreen && !inYellow) {
                        const green = config.green || {};
                        const rangeParts = [];
                        if (green.min !== undefined) rangeParts.push(`≥ ${green.min}`);
                        if (green.max !== undefined) rangeParts.push(`≤ ${green.max}`);
                        const range = rangeParts.length > 0 ? rangeParts.join(', ') : 'N/A';
                        
                        warnings.keratometry.push({
                            field,
                            label,
                            value: value.toFixed(2),
                            unit,
                            range
                        });
                    }
                }
            }
        }

        return warnings;
    };

    return {
        collectWarnings
    };
}
