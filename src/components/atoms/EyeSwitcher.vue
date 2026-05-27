<template>
    <div class="eye-switcher" :class="{ 'both-eyes-mode': !isLinked }">
        <div class="switcher-label" v-if="!isLinked">
            <span class="both-eyes-badge">OU</span>
            {{ t('eye.both') }}:
        </div>
        <div class="switcher-label" v-else>{{ t('generalInfo.eye') }}:</div>
        <div class="switcher-buttons">
            <button 
                type="button"
                class="eye-btn"
                :class="{ active: currentEye === 'OD' }"
                @click="$emit('switch', 'OD')"
                :disabled="disabled"
            >
                <span class="eye-label">OD</span>
                <span class="eye-name">{{ t('eye.right') }}</span>
            </button>
            <div class="switcher-divider">
                <SvgIcon name="arrow-right" :size="16" />
            </div>
            <button 
                type="button"
                class="eye-btn"
                :class="{ active: currentEye === 'OS' }"
                @click="$emit('switch', 'OS')"
                :disabled="disabled"
            >
                <span class="eye-label">OS</span>
                <span class="eye-name">{{ t('eye.left') }}</span>
            </button>
        </div>
        <div class="linked-badge" v-if="isLinked">
            <SvgIcon name="link" :size="14" />
            <span>{{ t('eye.linked') }}</span>
        </div>
    </div>
</template>

<script setup>
import { useI18n } from '@/composables/useI18n';
import SvgIcon from '@/components/atoms/SvgIcon.vue';

const { t } = useI18n();

defineProps({
    currentEye: { type: String, required: true },
    isLinked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
});

defineEmits(['switch']);
</script>

<style scoped>
.eye-switcher {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
    border-radius: 12px;
    border: 1px solid #c7d2fe;
}

.eye-switcher.both-eyes-mode {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-color: #f59e0b;
}

.both-eyes-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    background: #f59e0b;
    color: white;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    margin-right: 4px;
}

.switcher-label {
    font-size: 12px;
    font-weight: 600;
    color: #4b5563;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.switcher-buttons {
    display: flex;
    align-items: center;
    gap: 4px;
}

.eye-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 100px;
}

.eye-btn:hover:not(:disabled) {
    border-color: #6366f1;
    background: #f5f3ff;
}

.eye-btn.active {
    border-color: #6366f1;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.eye-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.eye-icon {
    font-size: 16px;
}

.eye-label {
    font-size: 14px;
    font-weight: 700;
}

.eye-name {
    font-size: 11px;
    opacity: 0.8;
}

.eye-btn.active .eye-name {
    opacity: 0.9;
}

.switcher-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    padding: 0 4px;
}

.linked-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: #dbeafe;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    color: #1e40af;
}

@media (max-width: 600px) {
    .eye-switcher {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .eye-btn {
        min-width: 80px;
        padding: 6px 12px;
    }
    
    .eye-name {
        display: none;
    }
}
</style>
