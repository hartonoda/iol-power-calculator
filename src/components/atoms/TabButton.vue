<template>
    <button 
        class="tab-button" 
        :class="{ active: isActive }"
        @click="$emit('click')"
    >
        <slot />
        <span v-if="count !== undefined" class="tab-count">{{ count }}</span>
    </button>
</template>

<script setup>
defineProps({
    isActive: { type: Boolean, default: false },
    count: { type: Number, default: undefined }
});

defineEmits(['click']);
</script>

<style scoped>
.tab-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    background: transparent;
    color: #6b7280;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    white-space: nowrap;
}

.tab-button:hover {
    color: #374151;
    background: #f9fafb;
}

.tab-button.active {
    color: #4361ee;
    border-bottom-color: #4361ee;
}

.tab-count {
    font-size: 11px;
    font-weight: 600;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: #e5e7eb;
    color: #6b7280;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tab-button.active .tab-count {
    background: #dbeafe;
    color: #1e40af;
}
</style>
