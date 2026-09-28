import { Node, Edge } from '@xyflow/react';

const getAdjacencyList = (edges: Edge[]): Record<string, string[]> => {
  const adjacencyList: Record<string, string[]> = {};
  edges.forEach((edge) => {
    if (!adjacencyList[edge.source]) adjacencyList[edge.source] = [];
    adjacencyList[edge.source].push(edge.target);
  });
  return adjacencyList;
}

export const getGhostNodes = (nodes: Node[], edges: Edge[], rootId: string): Set<string> => {
  const reachable = new Set<string>([rootId]);
  const queue: string[]= [rootId]
  const adjacencyList = getAdjacencyList(edges); 

  while (queue.length > 0) {
    const currentNode: string = queue.shift()!; // this is safe because we previously checked if our queue is empty
    const children: string[] = adjacencyList[currentNode] || [];
    children.forEach((child) => {
      if (!reachable.has(child)) {
        reachable.add(child);
        queue.push(child);
      }
    });
  }

  const ghostNodes = new Set<string>();
  nodes.forEach((node) => {
    if (!reachable.has(node.id)) ghostNodes.add(node.id);
  })

  return ghostNodes;
}

export const getSubtree = (nodes: Node[], edges: Edge[], nodeId: string): Set<string> => {
    const subTreeNodes = new Set<string>([nodeId]);
    const queue = [nodeId];
    const adjacencyList = getAdjacencyList(edges); 

    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      const children: string[] = adjacencyList[currentNode] || []
      children.forEach((child) => {
        if (!subTreeNodes.has(child)) {
            subTreeNodes.add(child);
            queue.push(child);
          }
      });
    }
    return subTreeNodes;
}

export const isDescendant = (sourceId: string, targetId: string, edges: Edge[]) => {
  const queue = [sourceId];
  const adjacencyList = getAdjacencyList(edges);
  const visited = new Set<string>([sourceId]);

  while (queue.length > 0) {
    const currentNode = queue.shift()!;
    if (currentNode === targetId) return true;
    const children = adjacencyList[currentNode] || [];
    children.forEach((child) => {
      if (!visited.has(child)) {
        visited.add(child);
        queue.push(child);
      }
    })
  }
  return false;
};
