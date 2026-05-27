<template>
    <div class="server-status" v-if="isElectron && serverInfo?.running">
        <div class="status-header" @click="toggleUrls">
            <div class="status-indicator"></div>
            <span class="status-label">Network Access</span>
            <span v-if="peerCount > 0" class="peer-badge">{{ peerCount }} peer{{ peerCount !== 1 ? 's' : '' }} synced</span>
            <SvgIcon :name="showUrls ? 'chevron-down' : 'chevron-right'" :size="12" />
        </div>
        <div class="status-urls" v-if="showUrls">
            <div v-for="url in serverInfo.urls" :key="url" class="url-item">
                <span class="url-text">{{ url }}</span>
                <button type="button" class="copy-btn" @click.stop="copyUrl(url)" title="Copy URL">
                    <SvgIcon name="link" :size="11" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SvgIcon from './SvgIcon.vue';

const serverInfo = ref(null);
const showUrls = ref(false);
const isElectron = ref(false);
const peerCount = ref(0);

onMounted(async () => {
    isElectron.value = window.isElectron === true;
    
    if (!isElectron.value || !window.api?.server) return;
    
    try {
        // Get server info
        const info = await window.api.server.getInfo();
        if (info?.running) {
            serverInfo.value = info;
        } else {
            // Retry after delay if server is starting
            setTimeout(async () => {
                const retryInfo = await window.api.server.getStatus();
                serverInfo.value = retryInfo;
            }, 2000);
        }
        if (window.api?.peerSync?.getStatus) {
            const status = await window.api.peerSync.getStatus();
            peerCount.value = status?.peerCount ?? 0;
            setInterval(async () => {
                const s = await window.api.peerSync.getStatus();
                peerCount.value = s?.peerCount ?? 0;
            }, 3000);
        }
    } catch (err) {
        console.error('Server status error:', err);
    }
});

function toggleUrls() {
    showUrls.value = !showUrls.value;
}

function copyUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        console.log('URL copied:', url);
    });
}
</script>

<style scoped>
.server-status {
    padding: 10px 16px;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border-bottom: 1px solid #d1fae5;
}

.status-header {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
}

.status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
}

.status-label {
    flex: 1;
    font-size: 12px;
    font-weight: 600;
    color: #166534;
}

.peer-badge {
    font-size: 11px;
    color: #059669;
    background: #d1fae5;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
}

.status-header svg {
    color: #16a34a;
}

.status-urls {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.url-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: white;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
}

.url-text {
    flex: 1;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    color: #047857;
    letter-spacing: -0.3px;
}

.copy-btn {
    padding: 4px;
    background: #ecfdf5;
    border: 1px solid #d1fae5;
    border-radius: 4px;
    cursor: pointer;
    color: #059669;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}

.copy-btn:hover {
    background: #d1fae5;
    color: #047857;
}

@media print {
    .server-status {
        display: none;
    }
}
</style>
