<template>
    <svg :width="size" :height="size" viewBox="0 0 256 256" fill="currentColor" class="app-logo">
        <!-- Outer ring -->
        <path d="M117.8,56.72c41.39,0,75.06,33.67,75.06,75.06s-33.67,75.06-75.06,75.06-75.06-33.67-75.06-75.06S76.41,56.72,117.8,56.72M117.8,32.04c-55.09,0-99.74,44.66-99.74,99.74s44.66,99.74,99.74,99.74,99.74-44.66,99.74-99.74-44.66-99.74-99.74-99.74h0Z"/>
        <!-- Inner ring (pupil) -->
        <path d="M117.8,110.52c11.72,0,21.26,9.54,21.26,21.26s-9.54,21.26-21.26,21.26-21.26-9.54-21.26-21.26,9.54-21.26,21.26-21.26M117.8,85.84c-25.37,0-45.94,20.57-45.94,45.94s20.57,45.94,45.94,45.94,45.94-20.57,45.94-45.94-20.57-45.94-45.94-45.94h0Z"/>
        <!-- Top left accent -->
        <rect x="19.64" y="32.04" width="20" height="26.7"/>
        <!-- Bottom right accent -->
        <rect x="188.08" y="209.18" width="49.86" height="20"/>
    </svg>
</template>

<script setup>
defineProps({
    size: { type: [Number, String], default: 32 }
});
</script>

<style scoped>
.app-logo {
    display: block;
}
</style>
