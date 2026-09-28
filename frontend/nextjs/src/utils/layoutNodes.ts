import dagre from 'dagre'
import { type Node, type Edge, Position} from '@xyflow/react'

const nodeWidth: number = 150;
const nodeHeight: number = 50;
const TREE_SPACING: number = 200;

export const layoutNodes = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction ,
                          ranksep: 100,  // <--- Increase this value (default is often 50 or 100)
                          nodesep: 50
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {width: nodeWidth, height: nodeHeight})
    })

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });
    
    dagre.layout(dagreGraph);

    const components = dagre.graphlib.alg.components(dagreGraph);
    
    components.sort((a, b) => b.length - a.length);

    const nodeXShifts = new Map<string, number>();
    let nextTreeStartX = 0;

    components.forEach((componentIds) => {
        let minX = Infinity;
        let maxX = -Infinity;

        componentIds.forEach((id) => {
            const n = dagreGraph.node(id);
            if (n.x < minX) minX = n.x;
            if (n.x > maxX) maxX = n.x;
        });

        const treeWidth = maxX - minX;

        const shiftAmount = nextTreeStartX - minX;

        componentIds.forEach((id) => nodeXShifts.set(id, shiftAmount));

        nextTreeStartX += treeWidth + TREE_SPACING;
    });

    const isHorizontal = direction === 'LR';
    const targetPos = isHorizontal ? Position.Left : Position.Top;
    const sourcePos = isHorizontal ? Position.Right : Position.Bottom;

    const nodesWithPosition = nodes.map((node) => {
        const dagreNode = dagreGraph.node(node.id);
        const shiftX = nodeXShifts.get(node.id) || 0; 
        
        return {
            ...node,
            targetPosition: targetPos,
            sourcePosition: sourcePos,
            position: {
                x: (dagreNode.x + shiftX) - nodeWidth / 2, 
                y: dagreNode.y - nodeHeight / 2,
            }
        }
    });

    return {nodes: nodesWithPosition, edges: edges};
}