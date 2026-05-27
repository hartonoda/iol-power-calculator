<template>
    <div class="age-field" :class="{ 'view-mode': disabled }">
        <label>{{ label }}<span v-if="disabled" class="colon">:</span></label>
        <div class="age-value">
            <span v-if="age !== null">{{ age }} {{ yearsLabel }}</span>
            <span v-else class="age-hint">—</span>
        </div>
    </div>
</template>

<script setup>
defineProps({
    label: { type: String, required: true },
    age: { type: [Number, null], default: null },
    yearsLabel: { type: String, default: 'anni' },
    disabled: { type: Boolean, default: false }
});
</script>

<style scoped>
.age-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.age-field label {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
}

.age-field label .colon {
    margin-left: 2px;
}

.age-value {
    padding: 8px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #f9fafb;
    font-size: 14px;
    color: #374151;
    min-height: 38px;
    display: flex;
    align-items: center;
}

.age-hint {
    color: #9ca3af;
}

/* View mode: remove border and background */
.age-field.view-mode {
    flex-direction: row;
    align-items: center;
    gap: 8px;
}

.age-field.view-mode .age-value {
    padding: 0;
    border: none;
    background: transparent;
    min-height: auto;
}

/* Print styles */
@media print {
    .age-field {
        gap: 1px !important;
    }
    
    .age-field label {
        font-size: 8px !important;
    }
    
    .age-value {
        font-size: 9px !important;
        padding: 2px 4px !important;
        min-height: auto !important;
    }
}
</style>
