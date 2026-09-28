import React, { useMemo } from 'react';
import './SmartHistogramSlider.css';

/**
 * Expected Data Structure from Backend
 */
export interface HistogramBin {
    bin_start: number;
    bin_end: number;
    count: number;
}

interface SmartHistogramSliderProps {
    bins: HistogramBin[];
    min: number;
    max: number;
    currentThreshold: number;
    onThresholdChange: (val: number) => void;
}

export const SmartHistogramSlider: React.FC<SmartHistogramSliderProps> = ({
    bins,
    min,
    max,
    currentThreshold,
    onThresholdChange
}) => {
    // Determine colors
    const COLOR_ONE = '#455E89';
    const COLOR_TWO = '#9ad1d4';
    const COLOR_TRACK = '#e5e7eb'; // fallback

    // Calculate max count for normalization
    const maxCount = useMemo(() => {
        if (!bins || bins.length === 0) return 1;
        return Math.max(...bins.map(b => b.count));
    }, [bins]);

    // Handle position for the thumb
    // Clamp handle percent between 0 and 100
    const range = max - min;
    const safeRange = range <= 0 ? 1 : range; // avoid division by zero
    const handlePercent = Math.min(100, Math.max(0, ((currentThreshold - min) / safeRange) * 100));

    return (
        <div className="smart-slider-container">
            {/* Layer 1: SVG Histogram */}
            <svg className="histogram-svg" preserveAspectRatio="none">
                {bins.map((bin, i) => {
                    // Logic: 
                    // Condition A: bin_range <= threshold (Mint)
                    // Condition B: bin_range > threshold (Rose)
                    // "If the threshold cuts through a bin... default to right-side color?"
                    // Let's check if the *entire* bin is to the left of threshold.

                    const isLeft = bin.bin_end <= currentThreshold;
                    const fillColor = isLeft ? COLOR_ONE : COLOR_TWO;

                    // Calculate bar height relative to max count
                    // We leave some padding at top (e.g. max height is 90% of container)
                    const heightPercent = maxCount > 0 ? (bin.count / maxCount) * 90 : 0;

                    // Width is proportional to bin size
                    const binWidth = bin.bin_end - bin.bin_start;
                    const widthPercent = (binWidth / safeRange) * 100;

                    // X position
                    const xPercent = ((bin.bin_start - min) / safeRange) * 100;

                    return (
                        <rect
                            key={i}
                            x={`${xPercent}%`}
                            y={`${100 - heightPercent}%`}
                            width={`${widthPercent}%`}
                            height={`${heightPercent}%`}
                            fill={fillColor}
                            className="histogram-bar"
                            // 1px gap implemented via rx/ry or CSS margin? 
                            // Easier to just subtract a tiny bit from width or use stroke
                            stroke="white"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                        />
                    );
                })}
            </svg>

            {/* Layer 2: Visual Handle with Cut Line */}
            <div
                className="slider-handle-container"
                style={{ left: `${handlePercent}%` }}
            >
                <div className="slider-cut-line"></div>
                <div className="slider-handle-thumb"></div>
            </div>

            {/* Layer 3: Interaction Input */}
            <input
                type="range"
                className="slider-input-range"
                min={min}
                max={max}
                step={safeRange / 100} // Granularity
                value={currentThreshold}
                onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
            />
        </div>
    );
};
