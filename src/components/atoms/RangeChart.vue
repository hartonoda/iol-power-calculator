<template>
    <div class="range-chart">
        <div class="range-track" :class="{ 'highlight': highlight }">
            <!-- Greyscale background segments representing deduction levels -->
            <div v-if="segments && segments.length > 0" class="deduction-segments">
                <div 
                    v-for="(segment, idx) in segments" 
                    :key="idx"
                    class="deduction-segment"
                    :style="{
                        left: `${((segment.start - parseFloat(minLabel || 0)) / (parseFloat(maxLabel || 100) - parseFloat(minLabel || 0))) * 100}%`,
                        width: `${((segment.end - segment.start) / (parseFloat(maxLabel || 100) - parseFloat(minLabel || 0))) * 100}%`,
                        backgroundColor: `rgba(0, 0, 0, ${Math.min(segment.deduction / 100, 0.4)})`
                    }"
                ></div>
            </div>
            <!-- Min marker -->
            <div class="min-marker" :style="{ left: `${minPos || 0}%` }"></div>
            <!-- Breakpoint lines -->
            <div 
                v-for="(bp, idx) in breakpoints" 
                :key="idx"
                class="breakpoint-line"
                :style="{ left: `${bp.position}%` }"
            ></div>
            <!-- Max marker -->
            <div class="max-marker" :style="{ left: `${maxPos || 100}%` }"></div>
            <!-- Value marker -->
            <div v-if="showMarker !== false" class="value-marker" :class="[status, { 'highlight': highlight, 'has-deduction': hasDeduction && !highlight }]" :style="markerStyle">
                <div class="marker-line"></div>
            </div>
        </div>
        <div class="range-labels">
            <span>{{ minLabel }}</span>
            <span class="range-text" :class="{ 'highlight': highlight, 'has-deduction': hasDeduction && !highlight }">{{ rangeText }}</span>
            <span>{{ maxLabel }}</span>
        </div>
    </div>
</template>

<script setup>
defineProps({
    segments: { type: Array, default: () => [] },
    breakpoints: { type: Array, default: () => [] },
    minPos: { type: Number, default: 0 },
    maxPos: { type: Number, default: 100 },
    minLabel: { type: [String, Number], default: '' },
    maxLabel: { type: [String, Number], default: '' },
    rangeText: { type: String, default: '' },
    markerStyle: { type: Object, default: () => ({}) },
    showMarker: { type: Boolean, default: true },
    status: { type: String, default: 'in-range' },
    highlight: { type: Boolean, default: false },
    hasDeduction: { type: Boolean, default: false }
});
</script>

<style scoped>
.range-chart {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    overflow: hidden;
}

.range-track {
    position: relative;
    height: 6px;
    background: #f3f4f6;
    border-radius: 3px;
    min-width: 0;
    overflow: visible;
    width: 100%;
    border: 1px solid transparent;
}

.range-track.highlight {
    background: #fed7aa;
    border-color: #fb923c;
}

.deduction-segments {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 3px;
    overflow: hidden;
}

.deduction-segment {
    position: absolute;
    top: 0;
    bottom: 0;
    height: 100%;
}

.min-marker,
.max-marker {
    position: absolute;
    top: -1px;
    width: 2px;
    height: 8px;
    background: #6b7280;
    border-radius: 1px;
    transform: translateX(-50%);
}

.breakpoint-line {
    position: absolute;
    top: -1px;
    width: 1px;
    height: 8px;
    background: #9ca3af;
    transform: translateX(-50%);
}

.value-marker {
    position: absolute;
    top: -2px;
    width: 2px;
    height: 10px;
    transform: translateX(-50%);
}

.marker-line {
    width: 100%;
    height: 100%;
    border-radius: 1px;
}

.value-marker.in-range .marker-line { 
    background: #15803d; 
}

.value-marker.out-range .marker-line { 
    background: #ea580c; 
}

.value-marker.highlight .marker-line {
    background: #ea580c !important;
    width: 3px;
    box-shadow: 0 0 4px rgba(234, 88, 12, 0.5);
}

.value-marker.has-deduction .marker-line {
    background: #ea580c !important;
}

.range-labels {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9px;
    color: #9ca3af;
    position: relative;
}

.range-labels > span:first-child,
.range-labels > span:last-child {
    flex: 1;
    flex-shrink: 0;
}

.range-labels > span:first-child {
    text-align: left;
    white-space: nowrap;
}

.range-labels > span:last-child {
    text-align: right;
    white-space: nowrap;
}

.range-text {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: #15803d;
    font-weight: 500;
}

.range-text.highlight {
    color: #ea580c;
    font-weight: 600;
}

.range-text.has-deduction {
    color: #ea580c;
    font-weight: 500;
}

@media (max-width: 1500px) {
    .range-labels {
        font-size: 8px;
    }
}
</style>
