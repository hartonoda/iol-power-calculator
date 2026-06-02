<template>

  <div class="iol-model-section">

    <div class="footer-row">

      <label class="footer-field model-field">

        <span class="lbl-row">

          <span class="lbl">Modello IOL:</span>

          <button

            v-if="!disabled"

            type="button"

            class="settings-btn"

            title="Gestisci modelli IOL"

            @click="showSettings = true"

          >

            <SvgIcon name="settings" :size="14" />

          </button>

        </span>

        <FmSelect

          v-model="form.iolModelSelected"

          :options="iolModelOptions"

          :disabled="disabled"

          placeholder="—"

        />

      </label>

      <label class="footer-field">

        <span class="lbl">T/ast:</span>

        <input v-model="form.iolT" type="text" :disabled="disabled" />

      </label>

      <label class="footer-field">

        <span class="lbl">AX IOL:</span>

        <input v-model="form.iolAx" type="text" :disabled="disabled" />

      </label>

      <label class="footer-field power-field">

        <span class="lbl">Potere IOL:</span>

        <input v-model="form.iolPower" type="text" class="power-input" :disabled="disabled" />

      </label>

      <label class="footer-field tunnel-field">

        <span class="lbl">Tunnel:</span>

        <input v-model="form.tunnel" type="text" :disabled="disabled" />

      </label>

    </div>



    <IolModelSettingsModal

      :show="showSettings"

      :models="iolModels"

      @close="showSettings = false"

      @saved="onModelsSaved"

    />

  </div>

</template>



<script setup>

import { computed, ref } from 'vue';

import FmSelect from '@/components/atoms/FmSelect.vue';

import SvgIcon from '@/components/atoms/SvgIcon.vue';

import IolModelSettingsModal from '@/components/molecules/IolModelSettingsModal.vue';

import dropdownOptions from '@/config/dropdownOptions.json';



const props = defineProps({

  form: { type: Object, required: true },

  iolModels: { type: Array, default: () => [] },

  disabled: { type: Boolean, default: false },

});



const emit = defineEmits(['iol-models-changed']);



const showSettings = ref(false);



const iolModelOptions = computed(() => {

  const fromDb = props.iolModels.map((m) => m.name);

  const merged = [...dropdownOptions.iolModels];

  fromDb.forEach((name) => {

    if (name && !merged.includes(name)) merged.push(name);

  });

  return merged.sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));

});



const onModelsSaved = () => {

  emit('iol-models-changed');

};

</script>



<style scoped>

.iol-model-section {

  margin-top: 4px;

}

.lbl {

  color: #1e40af;

  font-weight: 600;

  margin-right: 4px;

  white-space: nowrap;

}

.lbl-row {

  display: flex;

  align-items: center;

  gap: 6px;

}

.settings-btn {

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 4px;

  border: 1px solid #cbd5e1;

  background: white;

  border-radius: 4px;

  cursor: pointer;

  color: #475569;

}

.settings-btn:hover {

  background: #f1f5f9;

  color: #1e40af;

}

.footer-row {

  display: grid;

  grid-template-columns: minmax(12rem, 2.5fr) repeat(4, minmax(0, 1fr));

  gap: 12px;

  align-items: end;

  width: 100%;

  border-top: 2px solid #2563eb;

  padding-top: 12px;

}

.footer-field {

  display: flex;

  flex-direction: column;

  gap: 4px;

  min-width: 0;

}

.footer-field input,

.footer-field :deep(.fm-select) {

  width: 100%;

  box-sizing: border-box;

  padding: 6px 8px;

  border: 1px solid #cbd5e1;

  font-size: 13px;

}

.tunnel-field input {

  background: #fce7f3;

}

.model-field :deep(.fm-select) {

  min-width: 0;

  font-weight: 700;

  color: #b91c1c;

}

.power-field .power-input {

  font-weight: 700;

  color: #b91c1c;

  font-size: 15px;

}

</style>

