<template>
    <Teleport to="body">
        <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
            <div class="modal-container">
                <div class="modal-header">
                    <h2>Import NIDEK CSV</h2>
                    <button type="button" class="close-btn" @click="$emit('close')">
                        <SvgIcon name="close" :size="20" />
                    </button>
                </div>

                <div class="modal-body">
                    <div
                        class="drop-zone"
                        :class="{ dragging: isDragging }"
                        @dragenter.prevent="isDragging = true"
                        @dragover.prevent="isDragging = true"
                        @dragleave.prevent="isDragging = false"
                        @drop.prevent="handleDrop"
                    >
                        <p><strong>Drop CSV files here</strong> or select files</p>
                        <p class="drop-hint">Required: Daya Overview and Optical Quality CSV exports from the NIDEK machine.</p>
                        <input ref="fileInput" type="file" accept=".csv" multiple @change="handlePick" />
                    </div>

                    <div class="summary" v-if="selectedFiles.length">
                        Selected files: <strong>{{ selectedFiles.length }}</strong>
                    </div>

                    <div class="issues" v-if="issues.length">
                        <strong>Warnings</strong>
                        <ul>
                            <li v-for="(issue, idx) in issues.slice(0, 8)" :key="idx">{{ issue }}</li>
                        </ul>
                    </div>

                    <div class="preview" v-if="rows.length">
                        <div class="preview-title">Detected rows</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Eye</th>
                                    <th>Exam No</th>
                                    <th>Date</th>
                                    <th>Complete</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in rows" :key="`${row.patientId}_${row.eye}_${row.sourceTimestamp}`">
                                    <td>{{ row.patientName }}</td>
                                    <td>{{ row.eye }}</td>
                                    <td>{{ row.examNo ?? '-' }}</td>
                                    <td>{{ row.examDate ?? '-' }}</td>
                                    <td>{{ row.isComplete ? 'Yes' : 'No' }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn-cancel" @click="$emit('close')">Cancel</button>
                    <button type="button" class="btn-primary" :disabled="!selectedFiles.length || parsing" @click="parseFiles">
                        {{ parsing ? 'Parsing...' : 'Parse' }}
                    </button>
                    <button type="button" class="btn-submit" :disabled="!rows.length || rows.every(r => !r.isComplete)" @click="confirmImport">
                        Import & Create Patient
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import { parseNidekCsvText, mergeNidekRecords } from '@/utils/nidekImportUtils';

const props = defineProps({
    show: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'confirm']);

const fileInput = ref(null);
const isDragging = ref(false);
const selectedFiles = ref([]);
const rows = ref([]);
const issues = ref([]);
const parsing = ref(false);

function resetState() {
    selectedFiles.value = [];
    rows.value = [];
    issues.value = [];
    parsing.value = false;
}

function handlePick(event) {
    const files = Array.from(event.target.files || []);
    selectedFiles.value = files.filter((f) => f.name.toLowerCase().endsWith('.csv'));
}

function handleDrop(event) {
    isDragging.value = false;
    const files = Array.from(event.dataTransfer?.files || []);
    selectedFiles.value = files.filter((f) => f.name.toLowerCase().endsWith('.csv'));
}

function readAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.readAsText(file);
    });
}

async function parseFiles() {
    parsing.value = true;
    issues.value = [];
    rows.value = [];
    try {
        const parsed = [];
        for (const file of selectedFiles.value) {
            const text = await readAsText(file);
            parsed.push(parseNidekCsvText(text, file.name));
        }
        const merged = mergeNidekRecords(parsed);
        rows.value = merged.rows;
        issues.value = merged.issues;
    } catch (err) {
        issues.value = [err.message || 'Failed to parse files'];
    } finally {
        parsing.value = false;
    }
}

function confirmImport() {
    emit('confirm', rows.value.filter((r) => r.isComplete));
}

watch(() => props.show, (val) => {
    if (val) resetState();
});
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-container {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 820px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
}

.close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
}

.modal-body {
    padding: 16px 20px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.drop-zone {
    border: 2px dashed #dc2626;
    background: #ecfdf5;
    border-radius: 10px;
    padding: 16px;
    text-align: center;
}

.drop-zone.dragging {
    background: #bbf7d0;
}

.drop-zone input {
    margin-top: 8px;
}

.drop-hint {
    margin: 6px 0 0;
    font-size: 12px;
    color: #374151;
}

.summary {
    font-size: 13px;
    color: #374151;
}

.issues {
    background: #fffbeb;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    padding: 10px;
    font-size: 12px;
}

.issues ul {
    margin: 6px 0 0 16px;
    padding: 0;
}

.preview-title {
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 6px;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}

th, td {
    border: 1px solid #e5e7eb;
    padding: 6px 8px;
    text-align: left;
}

th {
    background: #f8fafc;
}

.modal-actions {
    padding: 12px 20px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.btn-cancel, .btn-primary, .btn-submit {
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    cursor: pointer;
}

.btn-primary {
    background: white;
}

.btn-submit {
    background: #15803d;
    color: white;
    border-color: #15803d;
}

.btn-submit:disabled, .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
