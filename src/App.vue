<template>
  <div class="app">
    <router-view />
  </div>
</template>

<script setup>
import { useViewportScale } from '@/composables/useViewportScale';

useViewportScale();
</script>

<style>
:root {
  --base-font-size: 16px;
  --viewport-scale: 1;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: var(--base-font-size);
  overflow-x: hidden;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 1rem;
  background: #f5f6fa;
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

@media print {
  @page {
    size: A4 landscape;
    margin: 8mm;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  html,
  body {
    height: auto !important;
    overflow: visible !important;
    background: white !important;
  }

  .app {
    min-height: auto !important;
    height: auto !important;
    overflow: visible !important;
  }

  .no-print {
    display: none !important;
  }

  /* Only the compact Valutazione report (see styles/main.css) */
  body * {
    visibility: hidden;
  }

  .print-view,
  .print-view * {
    visibility: visible;
  }

  .print-view {
    display: block !important;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    width: 100%;
    max-width: 281mm;
    margin: 0 auto;
    padding: 0;
  }
}
</style>
