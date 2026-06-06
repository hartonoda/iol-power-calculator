<template>
    <svg
        :width="size"
        :height="size"
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="app-logo"
        aria-hidden="true"
    >
        <rect x="28" y="28" width="200" height="200" rx="44" stroke="currentColor" stroke-width="14" />
        <path
            d="M68 128c0-34 27-58 60-58s60 24 60 58-27 58-60 58-60-24-60-58z"
            stroke="currentColor"
            stroke-width="12"
            stroke-linejoin="round"
        />
        <ellipse cx="128" cy="128" rx="34" ry="22" stroke="currentColor" stroke-width="10" />
        <path d="M96 128h64" stroke="currentColor" stroke-width="12" stroke-linecap="round" />
        <path d="M168 152v32" stroke="currentColor" stroke-width="12" stroke-linecap="round" />
        <path d="M152 168h32" stroke="currentColor" stroke-width="12" stroke-linecap="round" />
    </svg>
</template>

<script setup>
defineProps({
    size: { type: [Number, String], default: 32 },
});
</script>

<style scoped>
.app-logo {
    display: block;
}
</style>
