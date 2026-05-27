<template>
    <div class="tab-bar">
        <TabButton 
            v-for="tab in tabs" 
            :key="tab.id"
            :is-active="activeTab === tab.id"
            :count="tab.count"
            @click="$emit('update:activeTab', tab.id)"
        >
            {{ tab.label }}
        </TabButton>
    </div>
</template>

<script setup>
import TabButton from '@/components/atoms/TabButton.vue';

defineProps({
    tabs: { 
        type: Array, 
        required: true 
        // [{ id: 'string', label: 'string', count?: number }]
    },
    activeTab: { type: String, required: true }
});

defineEmits(['update:activeTab']);
</script>

<style scoped>
.tab-bar {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
    flex-shrink: 0;
}
</style>
