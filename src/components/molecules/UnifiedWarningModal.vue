<template>
    <Teleport to="body">
        <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
            <div class="warning-modal">
                <div class="modal-header">
                    <div class="header-title">
                        <SvgIcon name="warning" :size="20" />
                        <h2>{{ t('warnings.title') }}</h2>
                    </div>
                    <button type="button" class="close-btn" @click="$emit('close')">
                        <SvgIcon name="close" :size="20" />
                    </button>
                </div>
                
                <div class="modal-body">
                    <div v-if="!hasWarnings" class="no-warnings">
                        <SvgIcon name="info" :size="48" />
                        <p>{{ t('warnings.noWarnings') }}</p>
                    </div>
                    
                    <div v-else class="warnings-list">
                        <!-- Systemic Note Warning -->
                        <div v-if="warnings.systemicNote" class="warning-item systemic">
                            <div class="warning-header">
                                <SvgIcon name="warning" :size="16" />
                                <span>{{ t('iolType.systemicConditionsNoted') }}</span>
                            </div>
                            <div class="warning-content">
                                {{ warnings.systemicNote }}
                            </div>
                        </div>
                        
                        <!-- Ocular Note Warning -->
                        <div v-if="warnings.ocularNote" class="warning-item ocular">
                            <div class="warning-header">
                                <SvgIcon name="warning" :size="16" />
                                <span>{{ t('iolType.ocularConditionsNoted') }}</span>
                            </div>
                            <div class="warning-content">
                                {{ warnings.ocularNote }}
                            </div>
                        </div>
                        
                        <!-- Toric IOL Warning -->
                        <div v-if="warnings.toricIOL" class="warning-item toric">
                            <div class="warning-header">
                                <SvgIcon name="warning" :size="16" />
                                <span>{{ t('iolType.toricIOLIndicated') }}</span>
                            </div>
                            <div class="warning-content">
                                <div v-if="warnings.toricIOL.cylinder">
                                    {{ t('iolType.toricIOLMessage', { value: warnings.toricIOL.cylinder }) }}
                                </div>
                                <div v-if="warnings.toricIOL.sri" class="additional-warning">
                                    <strong>SRI:</strong> {{ warnings.toricIOL.sri.value }} ({{ t('iolType.normalRange') }}: ≤ {{ warnings.toricIOL.sri.max }})
                                </div>
                                <div v-if="warnings.toricIOL.sai" class="additional-warning">
                                    <strong>SAI:</strong> {{ warnings.toricIOL.sai.value }} ({{ t('iolType.normalRange') }}: ≤ {{ warnings.toricIOL.sai.max }})
                                </div>
                            </div>
                        </div>
                        
                        <!-- Spherical IOL Warning -->
                        <div v-if="warnings.sphericalIOL" class="warning-item spherical">
                            <div class="warning-header">
                                <SvgIcon name="info" :size="16" />
                                <span>{{ t('iolType.monofocaleStandard') }} - {{ t(warnings.sphericalIOL.messageKey) }}</span>
                            </div>
                            <div class="warning-content">
                                <strong>AbS:</strong> {{ warnings.sphericalIOL.value }} ({{ warnings.sphericalIOL.level === 'strong' ? '< -0.3' : '< -0.2' }})
                            </div>
                        </div>
                        
                        <!-- Zero Compatibility Warnings -->
                        <div v-for="warning in warnings.zeroCompatibility" :key="warning.type" class="warning-item zero-compatibility">
                            <div class="warning-header">
                                <SvgIcon name="warning" :size="16" />
                                <span>{{ warning.iolTypeName }} {{ t('iolType.notCompatible') }}</span>
                            </div>
                            <div class="warning-content">
                                <div>
                                    {{ warning.iolTypeName }} {{ t('iolType.notCompatible') }} because
                                    <span v-for="(param, idx) in warning.params" :key="idx">
                                        <span v-if="idx > 0 && idx < warning.params.length - 1">, </span>
                                        <span v-else-if="idx === warning.params.length - 1 && warning.params.length > 1"> and </span>
                                        <span v-else-if="idx === 0"> </span>
                                        <strong>{{ param.label }}</strong> is {{ param.value }}{{ param.unit }}
                                    </span>.
                                </div>
                            </div>
                        </div>
                        
                        <!-- Endothelial Warning -->
                        <div v-if="warnings.endothelial" class="warning-item endothelial">
                            <div class="warning-header">
                                <SvgIcon name="warning" :size="16" />
                                <span>{{ t('ocularParams.endothelialCells') }}</span>
                            </div>
                            <div class="warning-content">
                                {{ warnings.endothelial.message }}
                                <span v-if="warnings.endothelial.value"> ({{ warnings.endothelial.value }} cells/mm²)</span>
                            </div>
                        </div>
                        
                        <!-- Keratometry Warnings -->
                        <div v-if="warnings.keratometry && warnings.keratometry.length > 0" class="warning-group">
                            <div class="group-header">
                                <SvgIcon name="warning" :size="16" />
                                <span>{{ t('keratometry.title') }} - {{ t('warnings.outOfNormalRange') }}</span>
                            </div>
                            <div class="group-content">
                                <div v-for="warning in warnings.keratometry" :key="warning.field" class="warning-item keratometry">
                                    <div class="warning-content">
                                        <strong>{{ warning.label }}:</strong> {{ warning.value }}{{ warning.unit }}
                                        <span v-if="warning.range"> ({{ t('warnings.normalRange') }}: {{ warning.range }})</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();

const props = defineProps({
    show: { type: Boolean, default: false },
    warnings: { type: Object, required: true }
});

defineEmits(['close']);

const hasWarnings = computed(() => {
    const w = props.warnings;
    return w.systemicNote || 
           w.ocularNote || 
           w.toricIOL || 
           w.sphericalIOL || 
           (w.zeroCompatibility && w.zeroCompatibility.length > 0) ||
           w.endothelial ||
           (w.keratometry && w.keratometry.length > 0);
});
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
}

.warning-modal {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 700px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    animation: modalIn 0.2s ease-out;
}

@keyframes modalIn {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 10px;
}

.header-title h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
}

.header-title svg {
    color: #f59e0b;
}

.close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
}

.close-btn:hover {
    background: #f3f4f6;
    color: #1f2937;
}

.modal-body {
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
}

.no-warnings {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: #6b7280;
}

.no-warnings svg {
    color: #6b7280;
    margin-bottom: 12px;
    opacity: 0.5;
}

.no-warnings p {
    margin: 0;
    font-size: 14px;
}

.warnings-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.warning-item {
    padding: 12px 14px;
    border-radius: 6px;
    border: 1px solid;
}

.warning-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    font-weight: 600;
    font-size: 12px;
}

.warning-content {
    font-size: 12px;
    line-height: 1.5;
    padding-left: 24px;
}

.additional-warning {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed;
}

/* Warning type styles */
.warning-item.systemic {
    background: #fef3c7;
    border-color: #fcd34d;
}

.warning-item.systemic .warning-header {
    color: #b45309;
}

.warning-item.systemic .warning-header svg {
    color: #d97706;
}

.warning-item.systemic .warning-content {
    color: #92400e;
}

.warning-item.ocular {
    background: #fef3c7;
    border-color: #fcd34d;
}

.warning-item.ocular .warning-header {
    color: #b45309;
}

.warning-item.ocular .warning-header svg {
    color: #d97706;
}

.warning-item.ocular .warning-content {
    color: #92400e;
}

.warning-item.toric {
    background: #fef3c7;
    border-color: #fcd34d;
}

.warning-item.toric .warning-header {
    color: #b45309;
}

.warning-item.toric .warning-header svg {
    color: #d97706;
}

.warning-item.toric .warning-content {
    color: #92400e;
}

.warning-item.toric .additional-warning {
    border-color: #fcd34d;
}

.warning-item.spherical {
    background: #dbeafe;
    border-color: #93c5fd;
}

.warning-item.spherical .warning-header {
    color: #1e40af;
}

.warning-item.spherical .warning-header svg {
    color: #3b82f6;
}

.warning-item.spherical .warning-content {
    color: #1e3a8a;
}

.warning-item.zero-compatibility {
    background: #fee2e2;
    border-color: #fca5a5;
}

.warning-item.zero-compatibility .warning-header {
    color: #991b1b;
}

.warning-item.zero-compatibility .warning-header svg {
    color: #dc2626;
}

.warning-item.zero-compatibility .warning-content {
    color: #7f1d1d;
}

.warning-item.endothelial {
    background: #fef3c7;
    border-color: #fcd34d;
}

.warning-item.endothelial .warning-header {
    color: #b45309;
}

.warning-item.endothelial .warning-header svg {
    color: #d97706;
}

.warning-item.endothelial .warning-content {
    color: #92400e;
}

.warning-item.keratometry {
    background: #fff7ed;
    border-color: #fed7aa;
}

.warning-item.keratometry .warning-content {
    color: #9a3412;
    padding-left: 0;
}

.warning-group {
    padding: 12px 14px;
    border-radius: 6px;
    background: #fff7ed;
    border: 1px solid #fed7aa;
}

.group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    font-weight: 600;
    font-size: 12px;
    color: #9a3412;
}

.group-header svg {
    color: #f97316;
}

.group-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 24px;
}
</style>
