import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Composable to handle viewport scaling and prevent horizontal scrollbars
 * on high-resolution screens with zoom
 */
export function useViewportScale() {
    const scale = ref(1);
    const baseFontSize = ref(16); // Base font size in pixels

    const updateScale = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const devicePixelRatio = window.devicePixelRatio || 1;
        const screenWidth = window.screen?.width || viewportWidth;

        // Estimate physical resolution (viewport in CSS px × DPR, or screen size)
        const estimatedPhysicalWidth = Math.max(
            viewportWidth * devicePixelRatio,
            screenWidth
        );

        // Zoom level: when user has 200% zoom on 3000px screen, viewport ≈ 1500
        const zoomLevel = estimatedPhysicalWidth / viewportWidth;

        let calculatedBaseSize = 16;

        // High-resolution (3000x2000, 4K, etc.) – scale up for readability
        if (estimatedPhysicalWidth >= 3000) {
            calculatedBaseSize = 20;
        } else if (estimatedPhysicalWidth >= 2560) {
            calculatedBaseSize = 18;
        } else if (estimatedPhysicalWidth >= 1920) {
            calculatedBaseSize = 17;
        }

        // 200% zoom or high-DPI: user expects larger text
        if (zoomLevel >= 2 || devicePixelRatio >= 2) {
            calculatedBaseSize = Math.max(calculatedBaseSize, 20);
            if (viewportWidth <= 1600) {
                calculatedBaseSize = Math.max(calculatedBaseSize, 22);
            }
        } else if (zoomLevel >= 1.5) {
            calculatedBaseSize = Math.max(calculatedBaseSize * 1.2, 18);
        } else if (zoomLevel >= 1.2) {
            calculatedBaseSize = Math.max(calculatedBaseSize * 1.1, 17);
        }

        // Small viewport (zoomed in) – ensure minimum readability
        if (viewportWidth <= 1200) {
            calculatedBaseSize = Math.max(calculatedBaseSize, 18);
        }

        calculatedBaseSize = Math.min(calculatedBaseSize, 24);
        calculatedBaseSize = Math.max(calculatedBaseSize, 14);

        baseFontSize.value = calculatedBaseSize;
        scale.value = calculatedBaseSize / 16;
        
        // Set CSS custom property for REM calculations
        document.documentElement.style.setProperty('--base-font-size', `${baseFontSize.value}px`);
        document.documentElement.style.setProperty('--viewport-scale', scale.value.toString());
        // Data attribute for responsive CSS (e.g. high zoom media queries)
        document.documentElement.dataset.viewportScale = scale.value >= 1.25 ? 'high' : 'normal';
        
        // Prevent horizontal scrollbar
        document.documentElement.style.overflowX = 'hidden';
        document.body.style.overflowX = 'hidden';
        
        // Ensure body doesn't exceed viewport
        document.body.style.maxWidth = '100vw';
    };

    const handleResize = () => {
        updateScale();
    };

    onMounted(() => {
        // Run immediately on mount
        updateScale();
        
        // Also listen for resize events
        window.addEventListener('resize', handleResize);
        
        // Listen for zoom changes (if supported)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        }
    });

    onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
        if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', handleResize);
        }
    });

    return {
        scale,
        baseFontSize
    };
}
