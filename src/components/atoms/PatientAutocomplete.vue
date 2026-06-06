<template>
    <div class="patient-autocomplete" ref="containerRef">
        <label v-if="label">{{ label }}</label>
        <div class="input-wrapper">
            <input
                ref="inputRef"
                type="text"
                :value="searchText"
                :placeholder="placeholder"
                :disabled="disabled"
                @input="onInput"
                @focus="showDropdown = true"
                @keydown.down.prevent="navigateDown"
                @keydown.up.prevent="navigateUp"
                @keydown.enter.prevent="selectHighlighted"
                @keydown.escape="showDropdown = false"
            />
            <button 
                v-if="selectedPatient && !disabled" 
                type="button" 
                class="clear-btn"
                @click="clearSelection"
            >
                <SvgIcon name="close" :size="14" />
            </button>
        </div>
        
        <div v-if="showDropdown && !disabled" class="dropdown">
            <!-- Always show Add New Patient option at top -->
            <div class="add-new-section">
                <button type="button" class="btn-add-new" @click="$emit('add-new')">
                    <SvgIcon name="plus" :size="16" />
                    <span>Add New Patient</span>
                </button>
            </div>
            
            <!-- Patient list -->
            <div v-if="filteredPatients.length > 0" class="dropdown-list">
                <div class="list-header">
                    <span v-if="searchText.length > 0">Results for "{{ searchText }}"</span>
                    <span v-else>Recent patients</span>
                </div>
                <div
                    v-for="(patient, index) in filteredPatients"
                    :key="patient.id"
                    class="dropdown-item"
                    :class="{ highlighted: highlightedIndex === index }"
                    @click="selectPatient(patient)"
                    @mouseenter="highlightedIndex = index"
                >
                    <span class="patient-name">{{ patient.name }}</span>
                    <span class="patient-info">{{ formatDate(patient.dateOfBirth) }}</span>
                </div>
            </div>
            <div v-else-if="searchText.length > 0" class="no-results">
                <p>No patients found matching "{{ searchText }}"</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';

const props = defineProps({
    modelValue: { type: [Number, String], default: '' },
    patients: { type: Array, default: () => [] },
    label: { type: String, default: '' },
    placeholder: { type: String, default: 'Search patient...' },
    disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'add-new']);

const containerRef = ref(null);
const inputRef = ref(null);
const searchText = ref('');
const showDropdown = ref(false);
const highlightedIndex = ref(-1);

const selectedPatient = computed(() => 
    props.patients.find(p => p.id === props.modelValue)
);

const filteredPatients = computed(() => {
    if (!searchText.value.trim()) return props.patients.slice(0, 10);
    const query = searchText.value.toLowerCase();
    return props.patients.filter(p => 
        p.name.toLowerCase().includes(query)
    ).slice(0, 10);
});

const onInput = (e) => {
    searchText.value = e.target.value;
    showDropdown.value = true;
    highlightedIndex.value = -1;
    // Clear selection if typing
    if (props.modelValue) {
        emit('update:modelValue', '');
    }
};

const selectPatient = (patient) => {
    emit('update:modelValue', patient.id);
    searchText.value = patient.name;
    showDropdown.value = false;
    highlightedIndex.value = -1;
};

const clearSelection = () => {
    emit('update:modelValue', '');
    searchText.value = '';
    inputRef.value?.focus();
};

const navigateDown = () => {
    if (highlightedIndex.value < filteredPatients.value.length - 1) {
        highlightedIndex.value++;
    }
};

const navigateUp = () => {
    if (highlightedIndex.value > 0) {
        highlightedIndex.value--;
    }
};

const selectHighlighted = () => {
    if (highlightedIndex.value >= 0 && filteredPatients.value[highlightedIndex.value]) {
        selectPatient(filteredPatients.value[highlightedIndex.value]);
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const handleClickOutside = (e) => {
    if (containerRef.value && !containerRef.value.contains(e.target)) {
        showDropdown.value = false;
    }
};

// Watch both modelValue and patients array to update searchText
watch([() => props.modelValue, () => props.patients], ([newVal, newPatients]) => {
    if (newVal && newPatients.length > 0) {
        const patient = newPatients.find(p => p.id === newVal);
        if (patient) {
            searchText.value = patient.name;
        }
    } else if (!newVal) {
        searchText.value = '';
    }
}, { immediate: true });

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.patient-autocomplete {
    position: relative;
    display: flex;
    flex-direction: column;
}

.patient-autocomplete label {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 6px;
    text-transform: capitalize;
    letter-spacing: 0.03em;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.patient-autocomplete input {
    width: 100%;
    padding: 10px 32px 10px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.patient-autocomplete input:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.patient-autocomplete input:disabled {
    background: #f9fafb;
    color: #374151;
}

.clear-btn {
    position: absolute;
    right: 8px;
    background: #e5e7eb;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #6b7280;
    transition: background 0.2s;
}

.clear-btn:hover {
    background: #d1d5db;
}

.dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 100;
    max-height: 280px;
    overflow-y: auto;
}

.dropdown-list {
    padding: 4px;
}

.dropdown-item {
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s;
}

.dropdown-item:hover,
.dropdown-item.highlighted {
    background: #f3f4f6;
}

.patient-name {
    display: block;
    font-weight: 500;
    color: #1f2937;
}

.patient-info {
    display: block;
    font-size: 12px;
    color: #9ca3af;
    margin-top: 2px;
}

/* Add New Patient section - always visible */
.add-new-section {
    padding: 8px;
    border-bottom: 1px solid #e5e7eb;
}

.btn-add-new {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    background: #f0f9ff;
    border: 1px dashed #4ade80;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #15803d;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-add-new:hover {
    background: #bbf7d0;
    border-color: #dc2626;
}

.btn-add-new svg {
    flex-shrink: 0;
}

.list-header {
    padding: 8px 12px 4px;
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.no-results {
    padding: 16px;
    text-align: center;
}

.no-results p {
    margin: 0;
    color: #6b7280;
    font-size: 14px;
}
</style>




