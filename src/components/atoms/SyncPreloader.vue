<template>
  <Transition name="loading-fade">
    <div v-if="show" class="sync-preloader">
      <div class="sync-preloader__content">
        <div class="sync-preloader__spinner" />
        <p v-if="text" class="sync-preloader__text">{{ text }}</p>
        <p v-if="subtext" class="sync-preloader__subtext">{{ subtext }}</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: true },
  text: { type: String, default: '' },
  subtext: { type: String, default: '' }
});
</script>

<style scoped>
.sync-preloader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sync-preloader__content {
  text-align: center;
  color: #333;
}

.sync-preloader__spinner {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  border: 4px solid rgba(114, 114, 114, 0.5);
  border-top-color: #002feb;
  border-radius: 50%;
  animation: sync-preloader-spin 0.9s linear infinite;
}

.sync-preloader__text {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.sync-preloader__subtext {
  font-size: 0.875rem;
  opacity: 0.8;
}

@keyframes sync-preloader-spin {
  to { transform: rotate(360deg); }
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.3s ease;
}
.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}
</style>
