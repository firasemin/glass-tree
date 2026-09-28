import { type Node } from '@xyflow/react';

interface NodeMeta {
    node_id: number;
    impurity: number;
    n_node_samples: number;
    value: number[][];
    feature?: string | null;
    threshold?: number | null;
    class?: string | null;
}

interface NodeColorResult {
    color: string;
    border: string;
    background: string;
}

/**
 * Get node colors based on the selected color mode.
 * 
 * @param node - The React Flow node
 * @param colorMode - 'class' for classification coloring, 'purity' for impurity-based, 'none' for default
 */
const FEATURE_CATEGORIES: Record<string, string> = {
    // Demographics
    'Age': 'Demographics',
    'Sex': 'Demographics',

    // Vitals
    'BP': 'Vitals',
    'Max HR': 'Vitals',

    // Labs / Diagnostics
    'Cholesterol': 'Labs',
    'Thallium': 'Labs',
    'EKG results': 'Labs',
    'ST depression': 'Labs',
    'Slope of ST': 'Labs',
    'Number of vessels fluro': 'Labs',

    // History / Symptoms
    'Chest pain type': 'History',
    'Exercise angina': 'History',
};

const CATEGORY_COLORS: Record<string, string> = {
    'Demographics': '#2A9D8F', // Yellow
    'Vitals': '#F4A261',       // Orange
    'Labs': '#E76F51',         // Purple
    'History': '#264653',      // Blue
    'Default': '#95A5A6'       // Grey
};

/**
 * Get node colors based on the selected color mode.
 * 
 * @param node - The React Flow node
 * @param colorMode - 'class' for classification coloring, 'purity' for impurity-based, 'feature' for feature categories, 'none' for default
 */
export const getNodeColor = (
    node: Node,
    colorMode: 'class' | 'purity' | 'feature' | 'none'
): NodeColorResult => {
    const meta = node.data?.meta as NodeMeta | undefined;

    // Default colors
    const defaultResult: NodeColorResult = {
        color: '#333',
        border: '#ccc',
        background: '#fff',
    };

    if (!meta) {
        return defaultResult;
    }

    if (colorMode === 'none') {
        return defaultResult;
    }

    // 1. Feature DNA Map
    if (colorMode === 'feature' && meta.feature) {
        const category = FEATURE_CATEGORIES[meta.feature] || 'Default';
        const colorHex = CATEGORY_COLORS[category] || CATEGORY_COLORS['Default'];

        return {
            color: '#fff', // White text for better contrast on bright/neon colors
            border: colorHex,
            background: colorHex
        };
    }

    if (colorMode === 'class') {
        // Color by predicted class
        if (meta.class === 'Disease') {
            return {
                color: '#fff',
                border: '#c9184a',
                background: '#c9184a', // Red for disease
            };
        } else if (meta.class === 'No Disease') {
            return {
                color: '#fff',
                border: '#0eaa88',
                background: '#0eaa88', // Green for no disease
            };
        } else if (meta.value && meta.value[0]) {
            // Internal node - color by majority class in distribution
            const [noDisease, disease] = meta.value[0];
            if (disease > noDisease) {
                return {
                    color: '#333',
                    border: '#c9184a',
                    background: '#fbdbe4', // Light red
                };
            } else {
                return {
                    color: '#333',
                    border: '#0eaa88',
                    background: '#c6faef', // Light green
                };
            }
        }
    }

    if (colorMode === 'purity') {
        // Color by impurity (0 = pure, 0.5 = max impurity for binary)
        // Color by impurity (0 = pure, 0.5 = max impurity for binary)
        const impurity = meta?.impurity ?? 0;

        // Normalize to 0-1 (assuming max gini is 0.5)
        const ratio = Math.min(impurity / 0.5, 1);

        // Define stops
        // 0.0 (Green): #6a994e -> (106, 153, 78)
        // 0.5 (Yellow): #fca311 -> (252, 163, 17)  --> ratio 0.5 (impurity 0.25)
        // 1.0 (Red): #780000 -> (120, 0, 0)

        let r, g, b;

        if (ratio <= 0.5) {
            // Segment 1: Green -> Yellow (0 to 0.5)
            // Local ratio 0..1
            const localRatio = ratio / 0.5;
            r = Math.round(106 + localRatio * (252 - 106));
            g = Math.round(153 + localRatio * (163 - 153));
            b = Math.round(78 + localRatio * (17 - 78));
        } else {
            // Segment 2: Yellow -> Red (0.5 to 1.0)
            const localRatio = (ratio - 0.5) / 0.5;
            r = Math.round(252 + localRatio * (120 - 252));
            g = Math.round(163 + localRatio * (0 - 163));
            b = Math.round(17 + localRatio * (0 - 17));
        }

        const background = `rgb(${r}, ${g}, ${b})`;
        // Darker border
        const borderR = Math.round(r * 0.8);
        const borderG = Math.round(g * 0.8);
        const borderB = Math.round(b * 0.8);

        return {
            color: '#fff', // Always white text on these dark/saturated colors
            border: `rgb(${borderR}, ${borderG}, ${borderB})`,
            background,
        };
    }

    return defaultResult;
};
