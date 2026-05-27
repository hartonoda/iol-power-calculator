<template>
    <div 
        class="condition-card"
        :class="{ active: isActive }"
    >
        <label class="condition-checkbox">
            <input 
                type="checkbox" 
                :checked="isActive"
                :disabled="disabled"
                @change="handleToggle"
            />
            <span>{{ label }}</span>
        </label>
        <div v-if="isActive" class="severity-selector">
            <button 
                type="button"
                class="severity-btn lieve"
                :class="{ selected: severity === 'lieve' }"
                :disabled="disabled"
                @click="$emit('set-severity', value, 'lieve')"
            >{{ mildLabel }}</button>
            <button 
                type="button"
                class="severity-btn moderato"
                :class="{ selected: severity === 'moderato' }"
                :disabled="disabled"
                @click="$emit('set-severity', value, 'moderato')"
            >{{ moderateLabel }}</button>
            <button 
                type="button"
                class="severity-btn grave"
                :class="{ selected: severity === 'grave' }"
                :disabled="disabled"
                @click="$emit('set-severity', value, 'grave')"
            >{{ severeLabel }}</button>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    value: { type: String, required: true },
    label: { type: String, required: true },
    severity: { type: String, default: null }, // 'lieve' | 'moderato' | 'grave' | null
    disabled: { type: Boolean, default: false },
    mildLabel: { type: String, default: '+' },
    moderateLabel: { type: String, default: '++' },
    severeLabel: { type: String, default: '+++' }
});

const emit = defineEmits(['toggle', 'set-severity']);

const isActive = computed(() => !!props.severity);

import { computed } from 'vue';

const handleToggle = () => {
    emit('toggle', props.value);
};
</script>

<style scoped>
.condition-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px 10px;
    transition: all 0.15s;
}

.condition-card.active {
    background: #fefce8;
    border-color: #fde047;
}

.condition-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 11px;
}

.condition-checkbox input[type="checkbox"] {
    width: 14px;
    height: 14px;
    cursor: pointer;
}

.condition-checkbox input[type="checkbox"]:disabled {
    cursor: not-allowed;
}

.condition-checkbox span {
    color: #374151;
    line-height: 1.3;
}

.severity-selector {
    display: flex;
    gap: 4px;
    margin-top: 6px;
}

.severity-btn {
    flex: 1;
    padding: 4px 6px;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    background: white;
}

.severity-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

.severity-btn.lieve {
    color: #16a34a;
}

.severity-btn.lieve:hover:not(:disabled),
.severity-btn.lieve.selected {
    background: #dcfce7;
    border-color: #86efac;
}

.severity-btn.moderato {
    color: #ca8a04;
}

.severity-btn.moderato:hover:not(:disabled),
.severity-btn.moderato.selected {
    background: #fef3c7;
    border-color: #fde047;
}

.severity-btn.grave {
    color: #dc2626;
}

.severity-btn.grave:hover:not(:disabled),
.severity-btn.grave.selected {
    background: #fee2e2;
    border-color: #fca5a5;
}
</style>
