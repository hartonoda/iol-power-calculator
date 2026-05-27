<template>
    <div class="operations-list-panel">
        <!-- App Branding -->
        <div class="app-branding">
            <div class="branding-main-row">
                <div class="branding-left">
                    <div class="logo">
                        <AppLogo :size="32" />
                    </div>
                    <div class="brand-text">
                        <span class="brand-name">{{ t('app.name') }}</span>
                        <span class="brand-tagline">{{ t('app.tagline') }}</span>
                    </div>
                </div>
                <div class="branding-right">
                    <span class="version-badge">Valutazione</span>
                    <div class="language-selector">
                    <label class="sr-only" for="language-select">{{ t('common.language') }}</label>
                    <select
                        id="language-select"
                        class="language-select"
                        :value="locale"
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
            </div>
        </div>

        <!-- Add New Operation Button (hidden when new operation is active) -->
        <div class="add-section" v-if="selectedId !== null">
            <button class="btn-add-operation" @click="$emit('add')">
                <SvgIcon name="plus" :size="18" />
                <span>{{ t('operations.addNew') }}</span>
            </button>
        </div>

        <!-- Tab Bar -->
        <TabBar 
            :tabs="tabs" 
            v-model:active-tab="activeTab"
        />

        <!-- Tab Content -->
        <PatientsTab
            v-if="activeTab === 'pazienti'"
            :patients="patients"
            :operations="operations"
            :selected-id="selectedId"
            :search-placeholder="t('operations.searchPlaceholder')"
            :empty-message="t('empty.noPatients')"
            @select="$emit('select', $event)"
            @add-operation-for-patient="$emit('add-operation-for-patient', $event)"
            @edit-patient="$emit('edit-patient', $event)"
            @delete-patient="$emit('delete-patient', $event)"
            @delete-operation="$emit('delete-operation', $event)"
            @refresh="$emit('refresh')"
        />

        <InterventiTab
            v-if="activeTab === 'interventi'"
            :operations="operations"
            :patients="patients"
            :selected-id="selectedId"
            :filter-label="t('sidebar.filterByDate')"
            :empty-message="t('operations.noOperations')"
            @select="$emit('select', $event)"
            @delete="$emit('delete-operation', $event)"
        />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from '@/composables/useI18n';
import TabBar from '@/components/molecules/TabBar.vue';
import PatientsTab from '@/components/molecules/PatientsTab.vue';
import InterventiTab from '@/components/molecules/InterventiTab.vue';
import AppLogo from '@/components/atoms/AppLogo.vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
const { t, locale, setLocale, availableLocales } = useI18n();

const props = defineProps({
    operations: { type: Array, default: () => [] },
    patients: { type: Array, default: () => [] },
    selectedId: { type: [Number, null], default: null }
});

defineEmits(['select', 'add', 'add-operation-for-patient', 'edit-patient', 'delete-patient', 'delete-operation', 'refresh']);

// Tab state
const activeTab = ref('pazienti');

// Tabs configuration - show total patient count
const tabs = computed(() => [
    { id: 'pazienti', label: t('sidebar.patients'), count: props.patients.length },
    { id: 'interventi', label: t('sidebar.interventions'), count: props.operations.length }
]);

const handleLocaleChange = (event) => {
    setLocale(event.target.value);
};
</script>

<style scoped>
.operations-list-panel {
    background: white;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    min-width: 0;
}

/* App Branding */
.app-branding {
    padding: 14px 20px 16px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    flex-shrink: 0;
}

.branding-main-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.branding-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.branding-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    margin-left: auto;
}

.language-select {
    min-width: 86px;
    height: 28px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.08);
    color: white;
    padding: 0 8px;
    font-size: 12px;
    outline: none;
    cursor: pointer;
}

.language-select:focus {
    border-color: rgba(255, 255, 255, 0.85);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

.language-select option {
    color: #111827;
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

.logo {
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.brand-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.brand-name {
    font-size: 16px;
    font-weight: 700;
    color: white;
    letter-spacing: -0.3px;
}

.brand-tagline {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 400;
}

.version-badge {
    font-size: 9px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
    padding: 1px 5px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    letter-spacing: 0.3px;
}

.add-section {
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
}

.btn-add-operation {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 8px;
    border: 2px dashed #4361ee;
    background: #f8faff;
    color: #4361ee;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-add-operation:hover {
    background: #eef2ff;
    border-style: solid;
}

.btn-add-operation svg {
    flex-shrink: 0;
}
</style>
