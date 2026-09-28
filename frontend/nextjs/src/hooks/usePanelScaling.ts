import { useEffect, useState, RefObject } from 'react';

/**
 * A hook that calculates a scale factor for vertical panels to prevent them from colliding or overflowing the screen height.
 * 
 * @param refs - Array of refs to the panels that are stacked vertically (e.g., [TopPanel, BottomPanel])
 * @param margin - Minimum spacing between panels and screen edges (default 20px)
 * @returns scale - A number between 0 and 1 representing the scale factor
 */
export const usePanelScaling = (refs: RefObject<HTMLElement | null>[], margin: number = 20, trigger?: any) => {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const calculateScale = () => {
            let totalHeight = 0;

            // Calculate total height of all referenced panels
            for (const ref of refs) {
                if (ref.current) {
                    // Use offsetHeight to capture the full visual height including padding/borders
                    totalHeight += ref.current.offsetHeight;
                }
            }

            // Calculate available screen height
            // We subtract margin * (refs.length + 1) to account for top, bottom, and gap spacing
            // e.g. for 2 panels: Top Space + Panel 1 + Gap + Panel 2 + Bottom Space
            const spacing = margin * (refs.length + 1);
            const availableHeight = window.innerHeight - spacing;

            if (totalHeight > availableHeight && availableHeight > 0) {
                const newScale = availableHeight / totalHeight;
                // Clamp scale between 0.5 (don't get too tiny) and 1
                setScale(Math.max(0.5, Math.min(1, newScale)));
            } else {
                setScale(1);
            }
        };

        // Initial calculation
        calculateScale();

        // Small timeout to allow DOM to settle if a component just mounted
        setTimeout(calculateScale, 0);

        // Recalculate on resize
        window.addEventListener('resize', calculateScale);

        // Recalculate on DOM mutations (in case panel content changes size)
        const observer = new MutationObserver(calculateScale);
        refs.forEach(ref => {
            if (ref.current) {
                observer.observe(ref.current, { childList: true, subtree: true, attributes: true });
            }
        });

        return () => {
            window.removeEventListener('resize', calculateScale);
            observer.disconnect();
        };
    }, [refs, margin, trigger]);

    return scale;
};
