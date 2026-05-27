<template>
    <svg 
        :width="size" 
        :height="size" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        :stroke-width="strokeWidth"
        class="svg-icon"
    >
        <component :is="iconComponent" />
    </svg>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue';

const props = defineProps({
    name: { type: String, required: true },
    size: { type: [Number, String], default: 16 },
    strokeWidth: { type: [Number, String], default: 2 }
});

// Dynamic import of icon components
const icons = {
    search: defineAsyncComponent(() => import('@/assets/icons/SearchIcon.vue')),
    user: defineAsyncComponent(() => import('@/assets/icons/UserIcon.vue')),
    users: defineAsyncComponent(() => import('@/assets/icons/UsersIcon.vue')),
    'chevron-right': defineAsyncComponent(() => import('@/assets/icons/ChevronRightIcon.vue')),
    'chevron-down': defineAsyncComponent(() => import('@/assets/icons/ChevronDownIcon.vue')),
    trash: defineAsyncComponent(() => import('@/assets/icons/TrashIcon.vue')),
    plus: defineAsyncComponent(() => import('@/assets/icons/PlusIcon.vue')),
    print: defineAsyncComponent(() => import('@/assets/icons/PrintIcon.vue')),
    save: defineAsyncComponent(() => import('@/assets/icons/SaveIcon.vue')),
    close: defineAsyncComponent(() => import('@/assets/icons/CloseIcon.vue')),
    warning: defineAsyncComponent(() => import('@/assets/icons/WarningIcon.vue')),
    settings: defineAsyncComponent(() => import('@/assets/icons/SettingsIcon.vue')),
    calendar: defineAsyncComponent(() => import('@/assets/icons/CalendarIcon.vue')),
    info: defineAsyncComponent(() => import('@/assets/icons/InfoIcon.vue')),
    'eye-standard': defineAsyncComponent(() => import('@/assets/icons/EyeStandardIcon.vue')),
    'eye-plus': defineAsyncComponent(() => import('@/assets/icons/EyePlusIcon.vue')),
    'eye-edof': defineAsyncComponent(() => import('@/assets/icons/EyeEdofIcon.vue')),
    'eye-multifocal': defineAsyncComponent(() => import('@/assets/icons/EyeMultifocalIcon.vue')),
    'eye-toric': defineAsyncComponent(() => import('@/assets/icons/EyeToricIcon.vue')),
    'eye-postlvc': defineAsyncComponent(() => import('@/assets/icons/EyePostlvcIcon.vue')),
    'arrow-left': defineAsyncComponent(() => import('@/assets/icons/ArrowLeftIcon.vue')),
    'arrow-right': defineAsyncComponent(() => import('@/assets/icons/ArrowRightIcon.vue')),
    link: defineAsyncComponent(() => import('@/assets/icons/LinkIcon.vue')),
    eye: defineAsyncComponent(() => import('@/assets/icons/EyeIcon.vue')),
    circle: defineAsyncComponent(() => import('@/assets/icons/CircleIcon.vue')),
    ellipse: defineAsyncComponent(() => import('@/assets/icons/EllipseIcon.vue')),
    download: defineAsyncComponent(() => import('@/assets/icons/DownloadIcon.vue')),
    pencil: defineAsyncComponent(() => import('@/assets/icons/PencilIcon.vue'))
};

const iconComponent = computed(() => icons[props.name] || null);
</script>

<style scoped>
.svg-icon {
    display: inline-block;
    vertical-align: middle;
    flex-shrink: 0;
}
</style>
