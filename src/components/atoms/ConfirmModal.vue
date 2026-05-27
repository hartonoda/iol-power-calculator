<template>
    <Teleport to="body">
        <div v-if="show" class="modal-overlay" @click.self="$emit('cancel')">
            <div class="confirm-dialog">
                <div class="dialog-header">
                    <div class="dialog-icon" :class="variant">
                        <SvgIcon v-if="variant === 'danger'" name="warning" :size="24" />
                        <SvgIcon v-else name="info" :size="24" />
                    </div>
                    <h3>{{ title }}</h3>
                </div>
                <div class="dialog-body">
                    <p v-html="message"></p>
                    <p v-if="warning" class="warning-text">{{ warning }}</p>
                </div>
                <div class="dialog-actions">
                    <button class="btn-cancel" @click="$emit('cancel')">{{ cancelText }}</button>
                    <button 
                        class="btn-confirm" 
                        :class="variant"
                        @click="$emit('confirm')"
                    >{{ confirmText }}</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import SvgIcon from '@/components/atoms/SvgIcon.vue';

defineProps({
    show: { type: Boolean, default: false },
    title: { type: String, default: 'Confirm' },
    message: { type: String, default: 'Are you sure?' },
    warning: { type: String, default: '' },
    confirmText: { type: String, default: 'Confirm' },
    cancelText: { type: String, default: 'Cancel' },
    variant: { type: String, default: 'danger' } // 'danger', 'warning', 'info'
});

defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.confirm-dialog {
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 420px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.dialog-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
}

.dialog-icon.danger {
    background: #fee2e2;
    color: #dc2626;
}

.dialog-icon.warning {
    background: #fef3c7;
    color: #d97706;
}

.dialog-icon.info {
    background: #dbeafe;
    color: #2563eb;
}

.dialog-header h3 {
    margin: 0;
    color: #1a1a2e;
    font-size: 18px;
    font-weight: 600;
}

.dialog-body {
    margin-bottom: 24px;
}

.dialog-body p {
    margin: 0 0 8px;
    color: #6b7280;
    line-height: 1.5;
}

.dialog-body p:last-child {
    margin-bottom: 0;
}

.warning-text {
    color: #dc2626 !important;
    font-size: 13px;
    font-weight: 500;
}

.dialog-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.btn-cancel {
    background: #f3f4f6;
    color: #4b5563;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
}

.btn-cancel:hover {
    background: #e5e7eb;
}

.btn-confirm {
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
}

.btn-confirm.danger {
    background: #ef4444;
    color: white;
}

.btn-confirm.danger:hover {
    background: #dc2626;
}

.btn-confirm.warning {
    background: #f59e0b;
    color: white;
}

.btn-confirm.warning:hover {
    background: #d97706;
}

.btn-confirm.info {
    background: #3b82f6;
    color: white;
}

.btn-confirm.info:hover {
    background: #2563eb;
}
</style>
