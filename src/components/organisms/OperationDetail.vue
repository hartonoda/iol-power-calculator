<template>
    <div class="operation-detail-panel">
        <div class="panel-header no-print">
            <h2>{{ headerTitle }}</h2>
            <div class="header-actions">
                <template v-if="selectedId">
                    <button type="button" class="btn-export" @click="handlePrint" title="Stampa">
                        <SvgIcon name="print" :size="14" />
                        <span>Stampa</span>
                    </button>
                    <div class="header-divider"></div>
                </template>
                <button v-if="selectedId" type="button" class="btn-action btn-danger" @click="$emit('delete')">
                    <SvgIcon name="trash" :size="16" />
                    <span>Elimina</span>
                </button>
                <button
                    type="button"
                    class="btn-header-save"
                    :disabled="isSubmitting || (selectedId && !hasChanges)"
                    @click="$emit('submit')"
                >
                    <SvgIcon name="save" :size="16" />
                    <span>{{ isSubmitting ? 'Salvataggio...' : (selectedId ? 'Aggiorna' : 'Salva') }}</span>
                </button>
            </div>
        </div>

        <div v-if="errorMessage" class="error-message no-print">{{ errorMessage }}</div>

        <form class="detail-form no-print" @submit.prevent="$emit('submit')">
            <div v-if="showEyeSwitcher" class="eye-switcher no-print">
                <button
                    type="button"
                    :class="{ active: currentEyeForSwitcher === 'OD' }"
                    @click="handleEyeSwitch('OD')"
                >OD</button>
                <button
                    type="button"
                    :class="{ active: currentEyeForSwitcher === 'OS' }"
                    @click="handleEyeSwitch('OS')"
                >OS</button>
            </div>

            <ValutazioneForm
                :form="form"
                :patients="patients"
                :iol-models="iolModels"
                :is-existing="!!selectedId"
                @add-new-patient="$emit('add-new-patient')"
                @iol-models-changed="$emit('iol-models-changed')"
            />
        </form>

        <Teleport to="body">
            <PrintView :form="form" :patients="patients" />
        </Teleport>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import ValutazioneForm from '@/components/organisms/ValutazioneForm.vue';
import PrintView from '@/components/organisms/PrintView.vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import { printAsPdf } from '@/utils/exportUtils';

const props = defineProps({
    form: { type: Object, required: true },
    patients: { type: Array, default: () => [] },
    iolModels: { type: Array, default: () => [] },
    selectedId: { type: [Number, null], default: null },
    isSubmitting: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    isBothEyesMode: { type: Boolean, default: false },
    activeEye: { type: String, default: 'OD' },
    hasChanges: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'delete', 'add-new-patient', 'switch-eye', 'iol-models-changed']);

const showEyeSwitcher = computed(() => props.isBothEyesMode && !props.selectedId);

const currentEyeForSwitcher = computed(() => {
    if (showEyeSwitcher.value) return props.activeEye;
    return props.form.eye;
});

const headerTitle = computed(() => {
    if (!props.selectedId) return 'Nuova valutazione';
    const name = props.patients.find((p) => p.id === Number(props.form.patientId))?.name;
    return name ? `Valutazione — ${name}` : `Valutazione #${props.selectedId}`;
});

function handleEyeSwitch(eye) {
    emit('switch-eye', eye);
}

async function handlePrint() {
    if (window.api?.print?.preview) {
        await window.api.print.preview();
    } else {
        printAsPdf();
    }
}
</script>

<style scoped>
.operation-detail-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
    overflow: hidden;
}
.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
}
.panel-header h2 {
    margin: 0;
    font-size: 17px;
    color: #1f2937;
}
.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}
.header-divider {
    width: 1px;
    height: 24px;
    background: #e5e7eb;
}
.detail-form {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px 24px;
}
.eye-switcher {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}
.eye-switcher button {
    padding: 6px 16px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    border-radius: 6px;
    font-weight: 600;
}
.eye-switcher button.active {
    background: #4f46e5;
    color: white;
    border-color: #4f46e5;
}
.btn-header-save {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #4f46e5;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
}
.btn-export,
.btn-action {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    background: white;
}
.btn-danger {
    color: #b91c1c;
    border-color: #fecaca;
}
.error-message {
    color: #b91c1c;
    padding: 8px 20px;
}
</style>
