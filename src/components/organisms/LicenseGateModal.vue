<template>
    <div v-if="show" class="license-overlay">
        <div class="license-modal">
            <div class="modal-top-row">
                <div class="language-selector">
                    <label class="sr-only" for="license-language-select">{{ t('common.language') }}</label>
                    <select
                        id="license-language-select"
                        class="language-select"
                        :value="locale"
                        :disabled="loading"
                        @change="handleLocaleChange"
                    >
                        <option
                            v-for="lang in availableLocales"
                            :key="lang.code"
                            :value="lang.code"
                        >
                            {{ lang.flag }} {{ lang.name }}
                        </option>
                    </select>
                </div>
            </div>
            <h2>{{ t('license.title') }}</h2>
            <p class="subtitle">{{ t('license.subtitle') }}</p>

            <div class="field-group">
                <label for="license-key">{{ t('license.licenseKey') }}</label>
                <input
                    id="license-key"
                    v-model="form.licenseKey"
                    :disabled="loading"
                    maxlength="6"
                    autocomplete="off"
                    placeholder="A1B2C3"
                />
            </div>

            <div class="field-group">
                <label for="machine-id">{{ t('license.machineId') }}</label>
                <input
                    id="machine-id"
                    v-model="form.machineId"
                    :disabled="loading"
                    autocomplete="off"
                />
            </div>

            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

            <button class="btn-validate" :disabled="loading || !canSubmit" @click="submit">
                {{ loading ? t('license.validating') : t('license.validateAndContinue') }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { useI18n } from '@/composables/useI18n';

const { t, locale, setLocale, availableLocales } = useI18n();

const props = defineProps({
    show: { type: Boolean, default: false },
    machineId: { type: String, default: '' },
    initialLicenseKey: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
});

const emit = defineEmits(['submit']);

const form = reactive({
    licenseKey: '',
    machineId: '',
});

watch(
    () => props.machineId,
    (value) => {
        if (value && !form.machineId) {
            form.machineId = value;
        }
    },
    { immediate: true }
);

watch(
    () => props.initialLicenseKey,
    (value) => {
        if (value && !form.licenseKey) {
            form.licenseKey = value;
        }
    },
    { immediate: true }
);

const canSubmit = computed(() => form.licenseKey.trim().length > 0 && form.machineId.trim().length > 0);

const submit = () => {
    emit('submit', {
        licenseKey: form.licenseKey.trim().toUpperCase(),
        machineId: form.machineId.trim(),
    });
};

const handleLocaleChange = (event) => {
    setLocale(event.target.value);
};
</script>

<style scoped>
.license-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(15, 23, 42, 0.82);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
}

.license-modal {
    width: min(460px, 100%);
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 20px 45px rgba(2, 6, 23, 0.35);
    padding: 22px;
}

.modal-top-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
}

.language-select {
    min-width: 96px;
    height: 28px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #f9fafb;
    color: #111827;
    padding: 0 8px;
    font-size: 12px;
    outline: none;
}

.language-select:focus {
    border-color: #16a34a;
    box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.15);
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

h2 {
    margin: 0 0 8px;
    color: #111827;
    font-size: 20px;
}

.subtitle {
    margin: 0 0 16px;
    color: #6b7280;
    font-size: 13px;
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
}

.field-group label {
    font-size: 12px;
    font-weight: 600;
    color: #374151;
}

.field-group input {
    height: 36px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0 10px;
    font-size: 13px;
}

.field-group input:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.15);
}

.error-message {
    margin: 6px 0 14px;
    color: #15803d;
    font-size: 12px;
}

.btn-validate {
    width: 100%;
    height: 38px;
    border: none;
    border-radius: 8px;
    color: white;
    background: #15803d;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}

.btn-validate:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
