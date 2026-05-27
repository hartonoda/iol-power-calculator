/**
 * Utility functions to derive parameter ranges from IOL suitability score deductions
 * Normal range is defined as: deduction <= 40 points for the given IOL type
 */

const NUM_PATTERN = '(-?\\d+\\.?\\d*)';

/**
 * Parse a condition string to extract numeric values and range info
 */
function parseConditionRange(condition) {
    if (!condition || typeof condition !== 'string') {
        return null;
    }
    
    // "less than X" - range is (-Infinity, X)
    let match = condition.match(new RegExp(`^less than ${NUM_PATTERN}$`));
    if (match) {
        return {
            type: 'lessThan',
            value: parseFloat(match[1]),
            min: -Infinity,
            max: parseFloat(match[1])
        };
    }
    
    // "greater than X" - range is (X, Infinity)
    match = condition.match(new RegExp(`^greater than ${NUM_PATTERN}$`));
    if (match) {
        return {
            type: 'greaterThan',
            value: parseFloat(match[1]),
            min: parseFloat(match[1]),
            max: Infinity
        };
    }
    
    // "between X and Y" - range is [X, Y]
    match = condition.match(new RegExp(`^between ${NUM_PATTERN} and ${NUM_PATTERN}$`));
    if (match) {
        return {
            type: 'between',
            min: parseFloat(match[1]),
            max: parseFloat(match[2])
        };
    }
    
    // "outside X and Y" - range is (-Infinity, X) U (Y, Infinity)
    match = condition.match(new RegExp(`^outside ${NUM_PATTERN} and ${NUM_PATTERN}$`));
    if (match) {
        return {
            type: 'outside',
            min: parseFloat(match[1]),
            max: parseFloat(match[2])
        };
    }
    
    // Legacy format: "between X-Y"
    match = condition.match(/^between (\d+\.?\d*)-(\d+\.?\d*)$/);
    if (match) {
        return {
            type: 'between',
            min: parseFloat(match[1]),
            max: parseFloat(match[2])
        };
    }
    
    // Legacy format: "outside X-Y"
    match = condition.match(/^outside (\d+\.?\d*)-(\d+\.?\d*)$/);
    if (match) {
        return {
            type: 'outside',
            min: parseFloat(match[1]),
            max: parseFloat(match[2])
        };
    }
    
    return null;
}

/**
 * Extract all numeric values from thresholds to determine overall min/max
 */
function parseConditionValues(condition) {
    if (!condition || typeof condition !== 'string') {
        return [];
    }
    const range = parseConditionRange(condition);
    if (!range) return [];
    
    const values = [];
    if (range.min !== -Infinity && !isNaN(range.min)) values.push(range.min);
    if (range.max !== Infinity && !isNaN(range.max)) values.push(range.max);
    if (range.value !== undefined && !isNaN(range.value)) values.push(range.value);
    
    return values;
}

/**
 * Extract all numeric values from thresholds to determine overall min/max
 */
function getOverallRange(paramConfig) {
    if (!paramConfig || !paramConfig.thresholds) return null;
    
    const allValues = [];
    
    for (let i = 0; i < paramConfig.thresholds.length; i++) {
        const threshold = paramConfig.thresholds[i];
        
        // Handle breakpoint format
        let conditionStr = threshold.condition;
        if (threshold.conditionType === 'breakpoint' && threshold.conditionMax !== undefined) {
            // Reconstruct min from previous threshold
            let minValue = '';
            if (i > 0) {
                const prevThreshold = paramConfig.thresholds[i - 1];
                if (prevThreshold.conditionType === 'breakpoint' && prevThreshold.conditionMax !== undefined) {
                    minValue = prevThreshold.conditionMax.toString();
                } else if (prevThreshold.conditionType === 'less than' && prevThreshold.conditionValue) {
                    minValue = prevThreshold.conditionValue.toString();
                } else if (prevThreshold.condition && typeof prevThreshold.condition === 'string') {
                    const prevRange = parseConditionRange(prevThreshold.condition);
                    if (prevRange && (prevRange.type === 'between' || prevRange.type === 'lessThan')) {
                        minValue = prevRange.max.toString();
                    }
                }
            }
            if (minValue) {
                conditionStr = `between ${minValue} and ${threshold.conditionMax}`;
            } else {
                conditionStr = threshold.condition || `breakpoint ${threshold.conditionMax}`;
            }
        }
        
        const values = parseConditionValues(conditionStr);
        allValues.push(...values);
    }
    
    if (allValues.length === 0) return null;
    
    return {
        min: Math.min(...allValues),
        max: Math.max(...allValues)
    };
}

/**
 * Get acceptable range for a specific IOL type
 * Acceptable range = values where deduction <= 40 (absolute value)
 * For thresholds with "less than X" and "greater than Y", the gap [X, Y] is acceptable
 */
function getAcceptableRange(paramConfig, iolType) {
    if (!paramConfig || !paramConfig.thresholds) return null;
    
    let overallMin = Infinity;
    let overallMax = -Infinity;
    
    // First, get overall min/max from all thresholds for reference
    for (let i = 0; i < paramConfig.thresholds.length; i++) {
        const threshold = paramConfig.thresholds[i];
        
        // Handle breakpoint format
        let conditionStr = threshold.condition;
        if (threshold.conditionType === 'breakpoint' && threshold.conditionMax !== undefined) {
            // Reconstruct min from previous threshold
            let minValue = '';
            if (i > 0) {
                const prevThreshold = paramConfig.thresholds[i - 1];
                if (prevThreshold.conditionType === 'breakpoint' && prevThreshold.conditionMax !== undefined) {
                    minValue = prevThreshold.conditionMax.toString();
                } else if (prevThreshold.conditionType === 'less than' && prevThreshold.conditionValue) {
                    minValue = prevThreshold.conditionValue.toString();
                } else if (prevThreshold.condition && typeof prevThreshold.condition === 'string') {
                    const prevRange = parseConditionRange(prevThreshold.condition);
                    if (prevRange && (prevRange.type === 'between' || prevRange.type === 'lessThan')) {
                        minValue = prevRange.max.toString();
                    }
                }
            }
            if (minValue) {
                conditionStr = `between ${minValue} and ${threshold.conditionMax}`;
            } else {
                conditionStr = threshold.condition || `breakpoint ${threshold.conditionMax}`;
            }
        }
        
        const range = parseConditionRange(conditionStr);
        if (range) {
            if (range.type === 'between') {
                overallMin = Math.min(overallMin, range.min);
                overallMax = Math.max(overallMax, range.max);
            } else if (range.type === 'lessThan') {
                overallMax = Math.max(overallMax, range.max);
            } else if (range.type === 'greaterThan') {
                overallMin = Math.min(overallMin, range.min);
            }
        }
    }
    
    // Strategy: Find acceptable ranges
    // Acceptable = values that match thresholds with deduction <= 40 OR values in gaps (no match = no deduction)
    
    const acceptableRanges = [];
    let acceptableLessThanMax = -Infinity; // "less than" thresholds with acceptable deduction
    let acceptableGreaterThanMin = Infinity; // "greater than" thresholds with acceptable deduction
    const allRanges = [];
    
    // Process all thresholds
    for (let i = 0; i < paramConfig.thresholds.length; i++) {
        const threshold = paramConfig.thresholds[i];
        
        // Handle breakpoint format: reconstruct "between X and Y" from breakpoint
        let conditionStr = threshold.condition;
        if (threshold.conditionType === 'breakpoint' && threshold.conditionMax !== undefined) {
            // Reconstruct min from previous threshold
            let minValue = '';
            if (i > 0) {
                const prevThreshold = paramConfig.thresholds[i - 1];
                if (prevThreshold.conditionType === 'breakpoint' && prevThreshold.conditionMax !== undefined) {
                    minValue = prevThreshold.conditionMax.toString();
                } else if (prevThreshold.conditionType === 'less than' && prevThreshold.conditionValue) {
                    minValue = prevThreshold.conditionValue.toString();
                } else if (prevThreshold.condition && typeof prevThreshold.condition === 'string') {
                    const prevRange = parseConditionRange(prevThreshold.condition);
                    if (prevRange && (prevRange.type === 'between' || prevRange.type === 'lessThan')) {
                        minValue = prevRange.max.toString();
                    }
                }
            }
            // Reconstruct condition string for compatibility
            if (minValue) {
                conditionStr = `between ${minValue} and ${threshold.conditionMax}`;
            } else {
                conditionStr = threshold.condition || `breakpoint ${threshold.conditionMax}`;
            }
        }
        
        // Calculate deduction (handle progressive deductions)
        let deduction = 0;
        const deductionValue = threshold[iolType];
        if (typeof deductionValue === 'number') {
            deduction = Math.abs(deductionValue);
        } else if (deductionValue && typeof deductionValue === 'object' && 'min' in deductionValue && 'max' in deductionValue) {
            deduction = Math.max(Math.abs(deductionValue.min), Math.abs(deductionValue.max));
        }
        
        const range = parseConditionRange(conditionStr);
        if (!range) continue;
        
        allRanges.push({ range, deduction });
        
        // If deduction <= 40, this threshold's range is acceptable
        if (deduction <= 40) {
            if (range.type === 'lessThan') {
                // "less than X" with acceptable deduction means (-Infinity, X) is acceptable
                acceptableLessThanMax = Math.max(acceptableLessThanMax, range.max);
            } else if (range.type === 'greaterThan') {
                // "greater than X" with acceptable deduction means (X, Infinity) is acceptable
                acceptableGreaterThanMin = Math.min(acceptableGreaterThanMin, range.min);
            } else if (range.type === 'between') {
                acceptableRanges.push(range);
            }
        }
    }
    
    // Case 1: Both "less than" and "greater than" with acceptable deductions
    if (acceptableLessThanMax !== -Infinity && acceptableGreaterThanMin !== Infinity) {
        // Values < acceptableLessThanMax are acceptable (from "less than" threshold)
        // Values > acceptableGreaterThanMin are acceptable (from "greater than" threshold)
        // Values between them are also acceptable (gap = no deduction)
        // Return the full range from 0 (or overallMin) to acceptableGreaterThanMin
        return {
            acceptableMin: overallMin === Infinity ? 0 : overallMin,
            acceptableMax: acceptableGreaterThanMin
        };
    }
    
    // Case 2: Only "less than" with acceptable deduction
    // Values < acceptableLessThanMax are acceptable (from "less than" threshold)
    if (acceptableLessThanMax !== -Infinity && acceptableGreaterThanMin === Infinity) {
        let acceptableMin = overallMin === Infinity ? 0 : overallMin;
        let acceptableMax = acceptableLessThanMax;
        
        // Add acceptable "between" ranges that extend beyond acceptableLessThanMax
        if (acceptableRanges.length > 0) {
            acceptableRanges.sort((a, b) => a.min - b.min);
            // Extend acceptableMax to include all acceptable "between" ranges
            // Gaps between acceptableLessThanMax and first "between", and between "between" ranges are also acceptable
            acceptableMax = Math.max(acceptableLessThanMax, acceptableRanges[acceptableRanges.length - 1].max);
        } else {
            // No "between" ranges with acceptable deductions, find the next threshold to bound the range
            let nextThresholdMin = Infinity;
            for (const { range } of allRanges) {
                if (range.type === 'between' && range.min > acceptableLessThanMax) {
                    nextThresholdMin = Math.min(nextThresholdMin, range.min);
                } else if (range.type === 'greaterThan') {
                    nextThresholdMin = Math.min(nextThresholdMin, range.min);
                }
            }
            if (nextThresholdMin !== Infinity) {
                // Gap between acceptableLessThanMax and nextThresholdMin is acceptable (no deduction)
                acceptableMax = nextThresholdMin;
            } else {
                acceptableMax = overallMax === -Infinity ? acceptableLessThanMax * 2 : overallMax;
            }
        }
        
        return {
            acceptableMin: acceptableMin,
            acceptableMax: acceptableMax
        };
    }
    
    // Case 3: Only "greater than" with acceptable deduction
    // Values > acceptableGreaterThanMin are acceptable
    if (acceptableLessThanMax === -Infinity && acceptableGreaterThanMin !== Infinity) {
        let acceptableMin = overallMin === Infinity ? 0 : overallMin;
        let acceptableMax = acceptableGreaterThanMin;
        
        // Add acceptable "between" ranges that extend before acceptableGreaterThanMin
        if (acceptableRanges.length > 0) {
            acceptableRanges.sort((a, b) => a.min - b.min);
            // Extend acceptableMin to include all acceptable "between" ranges
            acceptableMin = Math.min(acceptableRanges[0].min, acceptableGreaterThanMin);
            acceptableMax = overallMax === -Infinity ? acceptableGreaterThanMin * 2 : overallMax;
        } else {
            // No "between" ranges, find the previous threshold to bound the range
            let prevThresholdMax = -Infinity;
            for (const { range } of allRanges) {
                if (range.type === 'between' && range.max < acceptableGreaterThanMin) {
                    prevThresholdMax = Math.max(prevThresholdMax, range.max);
                } else if (range.type === 'lessThan') {
                    prevThresholdMax = Math.max(prevThresholdMax, range.max);
                }
            }
            acceptableMin = prevThresholdMax !== -Infinity ? prevThresholdMax : (overallMin === Infinity ? 0 : overallMin);
            acceptableMax = overallMax === -Infinity ? acceptableGreaterThanMin * 2 : overallMax;
        }
        
        return {
            acceptableMin: acceptableMin,
            acceptableMax: acceptableMax
        };
    }
    
    // Case 4: Only "between" ranges with acceptable deductions
    if (acceptableRanges.length > 0) {
        acceptableRanges.sort((a, b) => a.min - b.min);
        
        // Find the union of all acceptable "between" ranges
        let acceptableMin = acceptableRanges[0].min;
        let acceptableMax = acceptableRanges[0].max;
        
        for (let i = 1; i < acceptableRanges.length; i++) {
            const range = acceptableRanges[i];
            acceptableMin = Math.min(acceptableMin, range.min);
            acceptableMax = Math.max(acceptableMax, range.max);
        }
        
        return {
            acceptableMin: acceptableMin,
            acceptableMax: acceptableMax
        };
    }
    
    // Fallback: if we can't determine, return null
    return null;
}

/**
 * Derive parameter ranges from scoreDeductions for a specific IOL type
 */
export function deriveParameterRanges(scoreDeductions, iolType) {
    const ranges = {};
    
    for (const [paramName, paramConfig] of Object.entries(scoreDeductions)) {
        if (paramName === 'description') continue;
        
        const overallRange = getOverallRange(paramConfig);
        const acceptableRange = getAcceptableRange(paramConfig, iolType);
        
        if (overallRange && acceptableRange) {
            // Try to get unit from description or use empty string
            // Units are typically in the description or we can infer from parameter name
            const unit = inferUnit(paramName);
            
            ranges[paramName] = {
                min: overallRange.min,
                max: overallRange.max,
                acceptableMin: acceptableRange.acceptableMin,
                acceptableMax: acceptableRange.acceptableMax,
                unit: unit,
                label: paramConfig.label || paramName
            };
        }
    }
    
    return ranges;
}

/**
 * Infer unit from parameter name or description
 */
function inferUnit(paramName) {
    const unitMap = {
        'OffsetLimbus': 'mm',
        'OffsetPupil': 'mm',
        'Cylinder': 'D',
        'PupilPhotopic': 'mm',
        'PupilMesopic': 'mm',
        'PupilScotopic': 'mm',
        'Endothelial': 'cells/mm²',
        'AxialLength': 'mm',
        'ACDepth': 'mm',
        'LensThickness': 'mm'
    };
    
    return unitMap[paramName] || '';
}

/**
 * Get all parameter ranges for all IOL types
 */
export function deriveAllParameterRanges(scoreDeductions) {
    return {
        monofocaleStandard: deriveParameterRanges(scoreDeductions, 'monofocaleStandard'),
        monofocalePlus: deriveParameterRanges(scoreDeductions, 'monofocalePlus'),
        edof: deriveParameterRanges(scoreDeductions, 'edof'),
        multifocal: deriveParameterRanges(scoreDeductions, 'multifocal')
    };
}
