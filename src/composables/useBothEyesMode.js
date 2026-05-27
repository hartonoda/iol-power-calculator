import { ref, computed, watch } from 'vue';
import { perEyeFields, getEmptyEyeData } from '@/config/formSchema';

/**
 * Composable for handling "both eyes" mode functionality
 * @param {Ref} form - The form ref
 */
export function useBothEyesMode(form) {
    // Track which eye is currently active
    const activeEye = ref('OS'); // 'OD' or 'OS' - default to OS (left eye)
    
    // Store per-eye data when in both eyes mode
    const eyeDataOD = ref({});
    const eyeDataOS = ref({});
    
    // Computed property for "both eyes" mode
    const isBothEyesMode = computed(() => form.value.eye === 'OU');
    
    // Save current eye data before switching
    const saveCurrentEyeData = () => {
        const data = {};
        perEyeFields.forEach(field => {
            data[field] = form.value[field];
        });
        if (activeEye.value === 'OD') {
            eyeDataOD.value = data;
        } else {
            eyeDataOS.value = data;
        }
    };
    
    // Load eye data when switching eyes
    const loadEyeData = (eye) => {
        const data = eye === 'OD' ? eyeDataOD.value : eyeDataOS.value;
        perEyeFields.forEach(field => {
            form.value[field] = data[field] || '';
        });
    };
    
    // Handle switching between eyes in both eyes mode
    const handleEyeSwitch = (targetEye) => {
        if (targetEye === activeEye.value) return;
        
        // Save current eye data
        saveCurrentEyeData();
        
        // Switch to target eye
        activeEye.value = targetEye;
        
        // Load target eye data
        loadEyeData(targetEye);
    };
    
    // Reset both eyes mode state
    const resetBothEyesMode = () => {
        activeEye.value = 'OS';
        eyeDataOD.value = {};
        eyeDataOS.value = {};
    };
    
    // Watch for eye selection changes to handle OU mode
    watch(() => form.value.eye, (newEye, oldEye) => {
        if (newEye === 'OU' && oldEye !== 'OU') {
            // Entering both eyes mode
            // Save current data as OS data (left eye first)
            saveCurrentEyeData();
            activeEye.value = 'OS';
            // Initialize OD with empty data
            eyeDataOD.value = getEmptyEyeData();
        } else if (newEye !== 'OU' && oldEye === 'OU') {
            // Leaving both eyes mode - keep current eye's data
            // Clear the stored eye data
            eyeDataOD.value = {};
            eyeDataOS.value = {};
        }
    });
    
    return {
        activeEye,
        eyeDataOD,
        eyeDataOS,
        isBothEyesMode,
        saveCurrentEyeData,
        loadEyeData,
        handleEyeSwitch,
        resetBothEyesMode
    };
}
