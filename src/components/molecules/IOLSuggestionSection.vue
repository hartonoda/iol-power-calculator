<template>
    <div class="section">
        <div class="section-header">
            <div class="section-title">
                <span v-if="eyeIndicator" class="eye-badge">{{ eyeIndicator }}</span>
                <span>{{ t('sections.iolModel') }}</span>
            </div>
            
            <!-- IOL Model Selector -->
            <IOLModelSelector
                v-model="form.iolModelSelected"
                :disabled="disabled"
            />
            
            <span class="section-badge">{{ form.iolModelSelected ? '1/1' : '0/1' }}</span>
        </div>
        
        <IOLCalculatorSection
            :form="form"
            :disabled="disabled"
            :visible="true"
        />
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from '@/composables/useI18n';
import IOLModelSelector from '@/components/atoms/IOLModelSelector.vue';
import IOLCalculatorSection from '@/components/molecules/IOLCalculatorSection.vue';

const { t } = useI18n();

const props = defineProps({
    form: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
    eyeIndicator: { type: String, default: '' }
});

const expanded = ref(true);

defineExpose({ expanded });
</script>

<style scoped>
.section {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    flex-shrink: 0;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    background: #f9fafb;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    color: #1f2937;
}

.eye-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 10px;
    background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%);
    color: white;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    box-shadow: 0 2px 4px rgba(26, 26, 46, 0.3);
    white-space: nowrap;
}

.section-badge {
    font-size: 12px;
    padding: 2px 8px;
    background: #e5e7eb;
    border-radius: 10px;
    color: #6b7280;
}
</style>
