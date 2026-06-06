<template>
    <div class="patients-tab">
        <!-- Search -->
        <div class="search-box">
            <div class="search-input-wrap">
                <SvgIcon name="search" :size="16" />
                <input v-model="search" type="text" :placeholder="searchPlaceholder" />
                <span v-if="filteredPatients.length > 0" class="result-count">
                    {{ filteredPatients.length }}
                </span>
            </div>
            <div class="search-actions">
                <button type="button" class="search-action-btn" @click="toggleSortByName">
                    {{ sortByName ? 'Sort: Name' : 'Sort: Recent' }}
                </button>
                <button type="button" class="search-action-btn" @click="emit('refresh')">
                    Refresh
                </button>
                <button
                    v-if="smartiolAvailable"
                    type="button"
                    class="search-action-btn smartiol-btn"
                    @click="emit('open-smartiol-import')"
                >
                    Importa da SmartIOL
                </button>
            </div>
        </div>

        <!-- List -->
        <div class="list-container">
            <div v-if="filteredPatients.length === 0" class="empty-list">
                <SvgIcon name="user" :size="40" :stroke-width="1.5" />
                <p>{{ emptyMessage }}</p>
            </div>
            
            <div 
                v-for="patient in filteredPatients" 
                :key="patient.id" 
                class="patient-group"
                :class="{ 'has-selection': hasSelectedOperation(patient) }"
            >
                <div 
                    class="patient-header"
                    :class="{ expanded: expandedPatients.has(patient.id) }"
                    @click="togglePatient(patient.id)"
                >
                    <div class="patient-info">
                        <SvgIcon 
                            name="chevron-right" 
                            :size="14" 
                            class="expand-icon" 
                            :class="{ rotated: expandedPatients.has(patient.id) }"
                        />
                        <div class="patient-details">
                            <span class="patient-name">{{ patient.name }}</span>
                            <span class="patient-meta">
                                {{ formatAge(patient.dateOfBirth) }} • {{ patient.gender }}
                            </span>
                        </div>
                    </div>
                    <span class="operation-count" :class="{ 'multiple': patient.operations.length > 1 }">
                        {{ patient.operations.length }}
                    </span>
                </div>
                
                <div 
                    v-if="expandedPatients.has(patient.id)" 
                    class="operations-sublist"
                >
                    <div 
                        v-for="op in patient.operations" 
                        :key="op.id" 
                        class="operation-item"
                        :class="{ selected: selectedId === op.id }"
                        @click.stop="emit('select', op)"
                    >
                        <span class="op-eye" :class="op.eye?.toLowerCase()">{{ op.eye || '?' }}</span>
                        <span class="op-date">{{ formatDate(op.operationDate) }}</span>
                        <button 
                            class="op-delete-btn"
                            @click.stop="emit('delete-operation', op)"
                            title="Delete operation"
                        >
                            <SvgIcon name="trash" :size="14" />
                        </button>
                    </div>
                    <!-- Patient Actions -->
                    <div class="patient-actions">
                        <button 
                            class="add-operation-btn"
                            @click.stop="emit('add-operation-for-patient', patient)"
                        >
                            <SvgIcon name="plus" :size="14" />
                            <span>{{ t('operations.addNew') }}</span>
                        </button>
                        <button 
                            class="edit-patient-btn"
                            @click.stop="emit('edit-patient', patient)"
                            :title="t('patients.editPatient')"
                        >
                            <SvgIcon name="pencil" :size="14" />
                            <span>{{ t('patients.editPatient') }}</span>
                        </button>
                        <button 
                            class="delete-patient-btn"
                            @click.stop="emit('delete-patient', patient)"
                            title="Delete patient"
                        >
                            <SvgIcon name="trash" :size="14" />
                            <span>Delete Patient</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();

const props = defineProps({
    patients: { type: Array, default: () => [] },
    operations: { type: Array, default: () => [] },
    selectedId: { type: [Number, null], default: null },
    searchPlaceholder: { type: String, default: 'Cerca pazienti...' },
    emptyMessage: { type: String, default: 'Nessun paziente trovato' },
    smartiolAvailable: { type: Boolean, default: false },
});

const emit = defineEmits([
    'select',
    'add-operation-for-patient',
    'edit-patient',
    'delete-patient',
    'delete-operation',
    'refresh',
    'open-smartiol-import',
]);

const search = ref('');
const sortByName = ref(false);
const expandedPatients = ref(new Set());

// Group operations by patient - include all patients
const patientsWithOperations = computed(() => {
    const patientMap = new Map();
    
    props.patients.forEach(p => {
        patientMap.set(p.id, { ...p, operations: [] });
    });
    
    props.operations.forEach(op => {
        if (patientMap.has(op.patientId)) {
            patientMap.get(op.patientId).operations.push(op);
        }
    });
    
    const withOps = Array.from(patientMap.values())
        .map(p => ({
            ...p,
            operations: p.operations.sort((a, b) => 
                new Date(b.operationDate) - new Date(a.operationDate)
            )
        }));

    if (sortByName.value) {
        return withOps.sort((a, b) => a.name.localeCompare(b.name));
    }

    return withOps.sort((a, b) => {
        // Sort by most recent operation date, patients without operations go to the end
        const dateA = a.operations[0]?.operationDate || '';
        const dateB = b.operations[0]?.operationDate || '';
        if (!dateA && !dateB) return a.name.localeCompare(b.name);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateB) - new Date(dateA);
    });
});

const filteredPatients = computed(() => {
    if (!search.value.trim()) return patientsWithOperations.value;
    const query = search.value.toLowerCase();
    return patientsWithOperations.value.filter(p => 
        p.name.toLowerCase().includes(query)
    );
});

const togglePatient = (patientId) => {
    if (expandedPatients.value.has(patientId)) {
        expandedPatients.value.delete(patientId);
    } else {
        expandedPatients.value.add(patientId);
    }
    expandedPatients.value = new Set(expandedPatients.value);
};

const toggleSortByName = () => {
    sortByName.value = !sortByName.value;
};

const hasSelectedOperation = (patient) => {
    return patient.operations.some(op => op.id === props.selectedId);
};

// Auto-expand patient when their operation is selected
watch(() => props.selectedId, (newId) => {
    if (newId) {
        const patient = patientsWithOperations.value.find(p => 
            p.operations.some(op => op.id === newId)
        );
        if (patient && !expandedPatients.value.has(patient.id)) {
            expandedPatients.value.add(patient.id);
            expandedPatients.value = new Set(expandedPatients.value);
        }
    }
}, { immediate: true });

const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Parse date parts to avoid timezone issues with date-only strings
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatAge = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const age = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${age}a`;
};
</script>

<style scoped>
.patients-tab {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}

.search-box {
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-bottom: 1px solid #e5e7eb;
    background: #fafbfc;
    flex-shrink: 0;
}

.search-input-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
}

.search-input-wrap:focus-within {
    border-color: var(--color-accent-light);
    box-shadow: 0 0 0 2px var(--color-accent-ring);
}

.search-actions {
    display: flex;
    gap: 8px;
}

.search-action-btn {
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #374151;
    font-size: 12px;
    font-weight: 500;
    padding: 5px 10px;
    cursor: pointer;
    transition: all 0.15s;
}

.search-action-btn:hover {
    border-color: #9ca3af;
    background: #f9fafb;
}
.search-action-btn.smartiol-btn {
    border-color: var(--color-accent);
    color: var(--color-brand-dark);
}
.search-action-btn.smartiol-btn:hover {
    background: var(--color-accent-subtle-bg);
}

.search-box svg {
    color: #9ca3af;
    flex-shrink: 0;
}

.search-box input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    background: transparent;
    min-width: 0;
}

.result-count {
    font-size: 11px;
    color: #9ca3af;
    background: #e5e7eb;
    padding: 2px 6px;
    border-radius: 10px;
}

.list-container {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding-bottom: 16px;
}

.empty-list {
    padding: 40px 20px;
    text-align: center;
    color: #9ca3af;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.empty-list svg { opacity: 0.4; }
.empty-list p { margin: 0; font-weight: 500; color: #6b7280; }

.patient-group {
    border-bottom: 1px solid #f0f0f0;
}

.patient-group.has-selection {
    background: #fafbff;
}

.patient-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background 0.15s;
}

.patient-header:hover { background: #f9fafb; }
.patient-header.expanded { background: #f3f4f6; border-bottom: 1px solid #e5e7eb; }

.patient-info {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
}

.expand-icon {
    color: #9ca3af;
    transition: transform 0.2s;
    flex-shrink: 0;
}

.expand-icon.rotated { transform: rotate(90deg); }

.patient-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.patient-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
    white-space: normal;
    word-break: break-word;
}

.patient-meta {
    font-size: 11px;
    color: #9ca3af;
}

.operation-count {
    font-size: 11px;
    font-weight: 600;
    min-width: 22px;
    height: 22px;
    background: #e5e7eb;
    color: #6b7280;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.operation-count.multiple {
    background: var(--color-accent-muted-bg);
    color: var(--color-label);
}

.operations-sublist {
    background: #fafbfc;
}

.operation-item {
    padding: 10px 16px 10px 38px;
    cursor: pointer;
    transition: background 0.15s;
    border-top: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.operation-item:first-child { border-top: none; }
.operation-item:hover { background: #f3f4f6; }

.operation-item.selected {
    background: var(--color-accent-hover-bg);
    border-left: 3px solid var(--color-accent);
    padding-left: 35px;
}

.op-eye {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: capitalize;
    flex-shrink: 0;
}

.op-eye.od { background: var(--color-accent-muted-bg); color: var(--color-label); }
.op-eye.os { background: #dcfce7; color: var(--color-brand-dark); }
.op-eye.ou { background: #fef3c7; color: #92400e; }

.op-date {
    font-size: 13px;
    color: #374151;
    flex: 1;
}

.op-delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border: none;
    background: transparent;
    color: #9ca3af;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s;
    flex-shrink: 0;
}

.operation-item:hover .op-delete-btn {
    opacity: 1;
}

.op-delete-btn:hover {
    background: #fee2e2;
    color: #dc2626;
}

.patient-actions {
    display: flex;
    gap: 8px;
    margin: 12px 16px 16px;
    padding-top: 4px;
}

.add-operation-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex: 1;
    padding: 8px 12px;
    border: 1px dashed #d1d5db;
    border-radius: 6px;
    background: white;
    color: #6b7280;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
}

.add-operation-btn:hover {
    background: #f0fdf4;
    border-color: #22c55e;
    color: #16a34a;
}

.add-operation-btn svg {
    flex-shrink: 0;
}

.edit-patient-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid var(--color-accent-border);
    border-radius: 6px;
    background: white;
    color: var(--color-accent);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
}

.edit-patient-btn:hover {
    background: var(--color-accent-subtle-bg);
    border-color: var(--color-accent-light);
}

.edit-patient-btn svg {
    flex-shrink: 0;
}

.delete-patient-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid #fecaca;
    border-radius: 6px;
    background: white;
    color: #dc2626;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
}

.delete-patient-btn:hover {
    background: #fef2f2;
    border-color: #ef4444;
}

.delete-patient-btn svg {
    flex-shrink: 0;
}
</style>
