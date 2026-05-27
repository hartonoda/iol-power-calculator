<template>
    <div class="eye-parameters-section">
        <BCDVASection
            ref="bcdvaSection"
            :form="form"
            :disabled="disabled"
            :eye-indicator="eyeIndicator"
        />

        <KeratometrySection
            ref="keratometrySection"
            :form="form"
            :disabled="disabled"
            :eye-indicator="eyeIndicator"
            @open-settings="$emit('open-keratometry-settings')"
        />

        <EndothelialSection
            ref="endothelialSection"
            :form="form"
            :disabled="disabled"
            :eye-indicator="eyeIndicator"
            @open-endothelial-settings="$emit('open-endothelial-settings')"
        />

        <EyeInfoSection
            ref="eyeSection"
            :form="form"
            :disabled="disabled"
            :eye-indicator="eyeIndicator"
        />

        <IOLTypeSuggestionSection
            ref="iolTypeSection"
            :form="form"
            :disabled="disabled"
            :eye-indicator="eyeIndicator"
            @open-iol-rules-settings="$emit('open-iol-rules-settings')"
        />

        <IOLSuggestionSection
            ref="iolSection"
            :form="form"
            :disabled="disabled"
            :eye-indicator="eyeIndicator"
        />
    </div>
</template>

<script setup>
import { ref } from 'vue';
import BCDVASection from '@/components/molecules/BCDVASection.vue';
import KeratometrySection from '@/components/molecules/KeratometrySection.vue';
import EndothelialSection from '@/components/molecules/EndothelialSection.vue';
import EyeInfoSection from '@/components/molecules/EyeInfoSection.vue';
import IOLTypeSuggestionSection from '@/components/molecules/IOLTypeSuggestionSection.vue';
import IOLSuggestionSection from '@/components/molecules/IOLSuggestionSection.vue';

defineProps({
    form: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
    eyeIndicator: { type: String, default: '' }
});

defineEmits(['open-keratometry-settings', 'open-iol-rules-settings', 'open-endothelial-settings']);

// Section refs for parent access if needed
const bcdvaSection = ref(null);
const keratometrySection = ref(null);
const endothelialSection = ref(null);
const eyeSection = ref(null);
const iolTypeSection = ref(null);
const iolSection = ref(null);

defineExpose({
    bcdvaSection,
    keratometrySection,
    endothelialSection,
    eyeSection,
    iolTypeSection,
    iolSection
});
</script>

<style scoped>
.eye-parameters-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
</style>
