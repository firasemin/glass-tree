export interface RawTreeNode {
    node_id: number;
    impurity: number;
    n_node_samples: number;
    value: number[][];
    feature?: string | null;
    threshold?: number | null;
    class?: string | null;
    children?: RawTreeNode[] | null;
}

export const formatThreshold = (threshold?: number | null) => {
    if (typeof threshold !== 'number' || Number.isNaN(threshold)) {
        return '';
    }
    const rounded = Number(threshold.toFixed(2));
    return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toString();
};

export const formatNodeLabel = (node: RawTreeNode): string => {
    if (node.class) {
        return `${node.class} (samples=${node.n_node_samples})`;
    }

    if (node.feature) {
        const formattedThreshold = formatThreshold(node.threshold);
        if (formattedThreshold) {
            //changed from <= to ≤
            return `${node.feature} ≤ ${formattedThreshold}`;
        }
        return node.feature;
    }

    return `Node ${node.node_id}`;
};
