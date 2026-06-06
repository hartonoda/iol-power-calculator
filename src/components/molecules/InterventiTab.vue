<template>
    <div class="interventi-tab">
        <!-- Date Filter -->
        <div class="filter-section">
            <DateFilter
                :label="filterLabel"
                v-model:from-date="fromDate"
                v-model:to-date="toDate"
                @clear="clearFilter"
            />
        </div>

        <!-- List -->
        <div class="list-container">
            <div v-if="filteredOperations.length === 0" class="empty-list">
                <SvgIcon name="calendar" :size="40" :stroke-width="1.5" />
                <p>{{ emptyMessage }}</p>
            </div>
            
            <div 
                v-for="op in filteredOperations" 
                :key="op.id" 
                class="operation-item"
                :class="{ selected: selectedId === op.id }"
                @click="$emit('select', op)"
            >
                <div class="op-main">
                    <span class="op-eye" :class="op.eye?.toLowerCase()">{{ op.eye || '?' }}</span>
                    <div class="op-info">
                        <span class="op-patient">{{ getPatientName(op.patientId) }}</span>
                        <span class="op-date">{{ formatDate(op.operationDate) }}</span>
                    </div>
                    <!-- Linked indicator -->
                    <span v-if="op.linkedOperationId" class="linked-indicator" title="Linked to other eye">
                        <SvgIcon name="link" :size="14" />
                    </span>
                    <!-- Delete button -->
                    <button 
                        class="op-delete-btn"
                        @click.stop="$emit('delete', op)"
                        title="Delete operation"
                    >
                        <SvgIcon name="trash" :size="14" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import DateFilter from '@/components/atoms/DateFilter.vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';

const props = defineProps({
    operations: { type: Array, default: () => [] },
    patients: { type: Array, default: () => [] },
    selectedId: { type: [Number, null], default: null },
    filterLabel: { type: String, default: 'Filtra per data' },
    emptyMessage: { type: String, default: 'Nessun intervento trovato' }
});

defineEmits(['select', 'delete']);

const fromDate = ref('');
const toDate = ref('');

// Sort operations from newest to oldest and filter by date
const filteredOperations = computed(() => {
    let ops = [...props.operations].sort((a, b) => 
        new Date(b.operationDate) - new Date(a.operationDate)
    );
    
    // Apply date filter
    if (fromDate.value) {
        const from = new Date(fromDate.value);
        from.setHours(0, 0, 0, 0);
        ops = ops.filter(op => {
            const opDate = new Date(op.operationDate);
            return opDate >= from;
        });
    }
    
    if (toDate.value) {
        const to = new Date(toDate.value);
        to.setHours(23, 59, 59, 999);
        ops = ops.filter(op => {
            const opDate = new Date(op.operationDate);
            return opDate <= to;
        });
    }
    
    return ops;
});

const getPatientName = (patientId) => {
    const patient = props.patients.find(p => p.id === patientId);
    return patient?.name || 'Paziente sconosciuto';
};

const clearFilter = () => {
    fromDate.value = '';
    toDate.value = '';
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Parse date parts to avoid timezone issues with date-only strings
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('it-IT', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });
};
</script>

<style scoped>
.interventi-tab {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}

.filter-section {
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    background: #fafbfc;
    flex-shrink: 0;
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

.operation-item {
    padding: 12px 16px;
    cursor: pointer;
    transition: background 0.15s;
    border-bottom: 1px solid #f0f0f0;
}

.operation-item:hover { background: #f9fafb; }

.operation-item.selected {
    background: #f0fdf4;
    border-left: 3px solid #16a34a;
    padding-left: 13px;
}

.op-main {
    display: flex;
    align-items: center;
    gap: 12px;
}

.op-eye {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: capitalize;
    flex-shrink: 0;
}

.op-eye.od { background: #bbf7d0; color: #166534; }
.op-eye.os { background: #dcfce7; color: #166534; }
.op-eye.ou { background: #fef3c7; color: #92400e; }

.op-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.op-patient {
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.op-date {
    font-size: 12px;
    color: #6b7280;
}

.linked-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #16a34a;
    flex-shrink: 0;
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
    margin-left: auto;
    flex-shrink: 0;
}

.operation-item:hover .op-delete-btn {
    opacity: 1;
}

.op-delete-btn:hover {
    background: #fee2e2;
    color: #dc2626;
}
</style>
