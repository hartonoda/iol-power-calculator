<template>
    <div class="date-filter">
        <label>{{ label }}</label>
        <div class="filter-inputs">
            <input 
                type="date" 
                :value="fromDate"
                @input="$emit('update:fromDate', $event.target.value)"
                :placeholder="fromPlaceholder"
            />
            <span class="separator">—</span>
            <input 
                type="date" 
                :value="toDate"
                @input="$emit('update:toDate', $event.target.value)"
                :placeholder="toPlaceholder"
            />
            <button 
                v-if="fromDate || toDate" 
                class="clear-btn" 
                @click="$emit('clear')"
                title="Clear filter"
            >
                <SvgIcon name="close" :size="14" />
            </button>
        </div>
    </div>
</template>

<script setup>
import SvgIcon from '@/components/atoms/SvgIcon.vue';

defineProps({
    label: { type: String, default: '' },
    fromDate: { type: String, default: '' },
    toDate: { type: String, default: '' },
    fromPlaceholder: { type: String, default: 'Da' },
    toPlaceholder: { type: String, default: 'A' }
});

defineEmits(['update:fromDate', 'update:toDate', 'clear']);
</script>

<style scoped>
.date-filter {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.date-filter label {
    font-size: 11px;
    font-weight: 500;
    color: #6b7280;
    text-transform: capitalize;
    letter-spacing: 0.3px;
}

.filter-inputs {
    display: flex;
    align-items: center;
    gap: 6px;
}

.filter-inputs input {
    flex: 1;
    min-width: 0;
    padding: 6px 8px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
    background: white;
}

.filter-inputs input:focus {
    outline: none;
    border-color: #4361ee;
}

.separator {
    color: #9ca3af;
    font-size: 12px;
    flex-shrink: 0;
}

.clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: #f3f4f6;
    border-radius: 4px;
    color: #6b7280;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s;
}

.clear-btn:hover {
    background: #e5e7eb;
    color: #374151;
}
</style>
