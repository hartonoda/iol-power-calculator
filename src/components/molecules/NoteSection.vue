<template>
    <div class="section">
        <div class="section-header">
            <div class="section-title">
                <span>{{ t('sections.note') }}</span>
            </div>
        </div>
        <div class="section-content">
            <!-- View mode: show text or "no notes" message -->
            <template v-if="disabled">
                <p v-if="form.noteIOLType && form.noteIOLType.trim()" class="note-text">{{ form.noteIOLType }}</p>
                <p v-else class="note-empty">{{ t('notes.noNotes') }}</p>
            </template>
            <!-- Edit mode: show textarea -->
            <textarea 
                v-else
                v-model="form.noteIOLType" 
                :disabled="disabled"
                :placeholder="t('notes.notePlaceholder')"
                rows="6"
            ></textarea>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();

const props = defineProps({
    form: { type: Object, required: true },
    disabled: { type: Boolean, default: false }
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

.section-content {
    border-top: 1px solid #e5e7eb;
    padding: 16px;
}

.section-content textarea {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
    font-family: inherit;
    resize: vertical;
    transition: border-color 0.2s, background 0.2s;
    min-height: 120px;
}

.section-content textarea:focus {
    outline: none;
    border-color: #6366f1;
    background: #f5f3ff;
}

.section-content textarea:disabled {
    background: #f9fafb;
    color: #374151;
}

.section-content textarea::placeholder {
    color: #9ca3af;
}

/* View mode styles */
.note-text {
    color: #374151;
    font-size: 12px;
    line-height: 1.5;
    margin: 0;
    white-space: pre-wrap;
}

.note-empty {
    color: #9ca3af;
    font-size: 12px;
    font-style: italic;
    margin: 0;
}

/* Print styles - Compact note */
@media print {
    .section {
        padding: 4px !important;
    }
    
    .section-header {
        padding: 3px 6px !important;
    }
    
    .section-title {
        font-size: 9px !important;
    }
    
    .section-content {
        padding: 4px !important;
    }
    
    .section-content textarea {
        min-height: 30px !important;
        padding: 3px !important;
        font-size: 8px !important;
    }
}
</style>
