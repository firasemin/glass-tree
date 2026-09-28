'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Panel,
  Background,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './TreeCanvas.css';

import { useTreeData } from '../../hooks/useTreeData'; // fix path naming
import { usePanelScaling } from '../../hooks/usePanelScaling';
import { layoutNodes } from '../../utils/layoutNodes' // fix path naming
import { NodeMenu } from './NodeMenu';
import { GraphMenu } from './GraphMenu';
import { PerformanceMenu } from './PerformanceMenu';
import { getGhostNodes, getSubtree, isDescendant } from '../../utils/graphUtils';
import { MoveModeBanner } from './MoveModePanel';
import { ColorLegend } from './ColorLegend';
import { getNodeColor } from '../../utils/getNodeColor';
import { RawTreeNode, formatNodeLabel } from '../../utils/treeUtils';


function TreeCanvasComponent() {
  const { nodes, edges, setNodes, setEdges, saveTreeState, undo, redo, resetTree, historyInfo, isSaving, evaluateCurrentTree, accuracyHistory, lastAccuracy, isEvaluating, reflowTree } = useTreeData();
  const { fitView } = useReactFlow();
  const [direction, setDirection] = useState('TB');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [colorMode, setColorMode] = useState<'class' | 'purity' | 'feature' | 'none'>('none');
  const selectedNode = nodes.find(n => n.id === selectedNodeId)

  // -- SCALING LOGIC START --
  const graphMenuRef = useRef<HTMLDivElement>(null);
  const nodeMenuRef = useRef<HTMLDivElement>(null);
  const scale = usePanelScaling([graphMenuRef, nodeMenuRef], 20, selectedNodeId);
  // -- SCALING LOGIC END --

  useEffect(() => {
    window.requestAnimationFrame(() => fitView());
  }, []);

  const updateLayout = useCallback((currentNodes: Node[], currentEdges: Edge[], shouldSave: boolean = true) => {
    const layouted = layoutNodes(currentNodes, currentEdges);
    setNodes(layouted.nodes)
    setEdges(layouted.edges)
    // window.requestAnimationFrame( () => fitView( { duration: 1000, padding: 0.2 } ) );

    // Save state after layout update (for operations that modify the tree)
    if (shouldSave) {
      saveTreeState(layouted.nodes, layouted.edges);
      reflowTree(layouted.nodes, layouted.edges); // Recalculate edge flows with new structure
    }
  }, [setNodes, setEdges, fitView, saveTreeState, reflowTree]);

  const handleModfifyNode = (updates: Partial<RawTreeNode>) => {
    if (!selectedNodeId) return;

    const isPruning = updates.feature === null && updates.class !== undefined;

    if (isPruning) {
      const rootNode = nodes.find((node) => node.id.includes('_root')) || nodes[0];
      const rootId = rootNode?.id;

      const nextEdges = edges.filter((edge) => edge.source !== selectedNodeId);

      const ghostNodeIds = rootId
        ? getGhostNodes(nodes, nextEdges, rootId)
        : new Set<string>();

      const nextNodes = nodes.map((node) => {

        if (node.id === selectedNodeId) {
          const currentMeta = node.data.meta as RawTreeNode;
          const newMeta = { ...currentMeta, ...updates };
          const newLabel = formatNodeLabel(newMeta);

          const isGhost = ghostNodeIds.has(node.id);
          const currentClassName = (node.className || '').replace('ghost-node', '').trim();

          return {
            ...node,
            className: isGhost ? `${currentClassName} ghost-node` : currentClassName,
            data: { ...node.data, label: newLabel, meta: newMeta, isGhost }
          };
        }

        const isGhost = ghostNodeIds.has(node.id);
        const currentClassName = (node.className || '').replace('ghost-node', '').trim();

        return {
          ...node,
          className: isGhost ? `${currentClassName} ghost-node` : currentClassName,
          data: {
            ...node.data,
            isGhost
          }
        };
      });

      updateLayout(nextNodes, nextEdges, false);

    } else {
      // Standard Update (Renaming, changing threshold, etc.)
      const newNodes = nodes.map((node) => {
        if (node.id === selectedNodeId) {
          const currentMeta = node.data.meta as RawTreeNode;
          const newMeta = { ...currentMeta, ...updates };
          const newLabel = formatNodeLabel(newMeta);
          return { ...node, data: { ...node.data, label: newLabel, meta: newMeta } };
        }
        return node;
      });

      setNodes(newNodes);
      saveTreeState(newNodes, edges);
      reflowTree(newNodes, edges);
    }
  }

  const handleAddNode = () => {
    if (!selectedNodeId) return;

    //We don't allow adding children to leaf nodes
    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    const meta = selectedNode?.data?.meta as RawTreeNode | undefined;
    const isLeaf = !!meta?.class || meta?.feature == null;
    if (isLeaf) {
      alert('Cannot add children to a leaf node.');
      return;
    }

    const childCount = edges.filter(e => e.source === selectedNodeId).length;
    if (childCount >= 2) {
      alert('This node already has two children!');
      return;
    }
    const takenIds = nodes.map(node => parseInt(node.id, 10))
    const maxId = takenIds.length > 0 ? Math.max(...takenIds) : 0;
    const newId = (maxId + 1).toString();


    const newNode: Node = {
      id: newId,
      position: { x: 0, y: 0 },
      data: {
        label: 'New Node',
        meta: {
          node_id: parseInt(newId, 10),
          impurity: 0,
          n_node_samples: 0,
          value: [],
          feature: 'Age',
          threshold: 0.5,
          class: null,
        }
      }
    };

    const newEdge: Edge = {
      id: `${selectedNodeId}_${newId}`,
      source: selectedNodeId,
      target: newId,
      style: { strokeWidth: 2, stroke: '#b1b1b7' }
    };


    const newNodes = [...nodes, newNode]
    const newEdges = [...edges, newEdge]
    setNodes(newNodes);
    setEdges(newEdges);

    takenIds.push(maxId + 1);
    updateLayout(newNodes, newEdges, false);
  }

  const handleDelete = () => {
    if (!selectedNodeId) return;

    const nodesToDelete = getSubtree(nodes, edges, selectedNodeId);
    const nextNodes = nodes.filter((node) => !nodesToDelete.has(node.id));
    const nextEdges = edges.filter((edge) =>
      !nodesToDelete.has(edge.source) && !nodesToDelete.has(edge.target)
    );

    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeId(null);

    updateLayout(nextNodes, nextEdges);
  }

  const handleMove = () => {
    if (!selectedNodeId) return;

    if (selectedNodeId.includes('_root')) {
      alert("Cannot move the Root node.");
      return;
    }

    setIsMoveMode(true);
  };

  // review handleCut and setIsMovedMode as they have been partially generated by AI
  const handleCut = () => {
    // 1. Safety Checks
    if (!selectedNode) return;

    // Dynamically find the root ID based on your convention
    const rootNode = nodes.find((node) => node.id.includes('_root'));
    if (!rootNode) {
      console.error("No root node found matching '_root'");
      return;
    }
    const rootId = rootNode.id;

    // 2. Perform the Topological Cut
    // Remove any edge where the 'target' is the currently selected node
    const nextEdges = edges.filter((edge) => edge.target !== selectedNode.id);

    // 3. Reachability Analysis
    // Calculate which nodes are no longer strictly reachable from the root
    const ghostNodeIds = getGhostNodes(nodes, nextEdges, rootId);

    // 4. Update Node Visuals
    const nextNodes = nodes.map((node) => {
      const isGhost = ghostNodeIds.has(node.id);

      // Cleanly manage the class string to avoid duplicates
      const currentClassName = (node.className || '').replace('ghost-node', '').trim();

      return {
        ...node,
        className: isGhost ? `${currentClassName} ghost-node` : currentClassName,
        data: {
          ...node.data,
          isGhost, // Useful flag if your custom node component needs to react logically
        },
      };
    });

    // 5. Commit State
    setEdges(nextEdges);
    setNodes(nextNodes);

    updateLayout(nextNodes, nextEdges, false);
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    // --- MOVE MODE LOGIC ---
    if (isMoveMode) {
      // 1. Validation
      if (!selectedNodeId) return;

      if (node.id === selectedNodeId) {
        setIsMoveMode(false); // Cancel if clicking self
        return;
      }

      // Check Constraint: Target cannot have more than 2 children
      const childCount = edges.filter((e) => e.source === node.id).length;
      if (childCount >= 2) {
        alert('Target node already has two children!');
        return;
      }

      // Check Constraint: Cannot move parent into its own child (Cycles)
      if (isDescendant(selectedNodeId, node.id, edges)) {
        alert('Cannot move a node into its own descendant.');
        return;
      }

      // 2. Perform Move
      // Remove the old edge pointing TO the selected node (disconnect from old parent)
      const otherEdges = edges.filter((e) => e.target !== selectedNodeId);

      // Create new edge FROM the target node TO the selected node
      const newEdge: Edge = {
        id: `${node.id}_${selectedNodeId}`,
        source: node.id,
        target: selectedNodeId
      };

      const nextEdges = [...otherEdges, newEdge];

      // 3. Cleanup Visuals
      // If the node was previously "cut" (ghost), remove the ghost styling
      // (We map over nodes to strip the 'ghost-node' class from the moved node)
      const nextNodes = nodes.map(n => {
        if (n.id === selectedNodeId) {
          return { ...n, className: (n.className || '').replace('ghost-node', '').trim() };
        }
        return n;
      });

      // 4. Update State & Layout
      setEdges(nextEdges);
      setNodes(nextNodes);
      updateLayout(nextNodes, nextEdges);

      // 5. Exit Mode
      setIsMoveMode(false);
      return;
    }

    // --- STANDARD SELECTION LOGIC ---
    setSelectedNodeId(node.id);
  }

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((ns: Node[]) => applyNodeChanges(changes, ns)), [setNodes]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((es: Edge[]) => applyEdgeChanges(changes, es)), [setEdges]);

  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    // const elements = document.elementsFromPoint(event.clientX,event.clientY);
  }, []);

  const handleLayoutChange = useCallback((direction: string) => {
    setDirection(direction)

    const newLayout = layoutNodes(nodes, edges, direction);

    setNodes([...newLayout.nodes]);
    setEdges([...newLayout.edges]);

    window.requestAnimationFrame(() => {
      fitView({ duration: 1000, padding: 0.2 });
    });
  }, [nodes, edges, setNodes, setEdges, fitView]);

  const handleResetLayout = useCallback(() => {
    const layouted = layoutNodes(nodes, edges, direction);
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
    window.requestAnimationFrame(() => fitView({ duration: 1000, padding: 0.2 }));
  }, [nodes, edges, direction, setNodes, setEdges, fitView]);

  const handleFitView = useCallback(() => {
    fitView({ duration: 1000, padding: 0.2 });
  }, [fitView]);

  const onNodeDragStart = useCallback(() => {
    setIsDraggingNode(true);
  }, []);

  const onNodeDragStop = useCallback(() => {
    setIsDraggingNode(false);
  }, []);



  const isAnyNodeSelected = nodes.some((n) => n.selected);

  // --- DERIVED STATE FOR DISPLAY ---
  // Apply styles (colors, borders) on the fly without mutating underlying state
  const displayNodes = useMemo(() => {
    return nodes.map((node) => {
      const { color, border, background } = getNodeColor(node, colorMode);
      return {
        ...node,
        style: {
          ...node.style,
          backgroundColor: background,
          color: color,
          border: `1px solid ${border}`,
          transition: 'background-color 0.3s ease',
        },
      };
    });
  }, [nodes, colorMode]);

  const displayEdges = useMemo(() => {
    return edges.map((edge) => {
      // Find the target node for this edge
      const targetNode = nodes.find((n) => n.id === edge.target);

      // Default grey
      let newColor = '#9393934d';

      // Apply coloring if mode is 'class' (or generic activated color map)
      if (colorMode === 'class' && targetNode) {
        const meta = targetNode.data.meta as RawTreeNode;
        if (meta?.value?.[0]) {
          const [noDisease, disease] = meta.value[0];
          // Colors from user's manual edit
          newColor = disease > noDisease ? '#fbdbe4' : '#c6faef';
        }
      }

      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: newColor,
          transition: 'stroke 0.3s ease',
        }
      };
    });
  }, [edges, nodes, colorMode]);


  // --- AUTO-EVALUATION ON STARTUP ---
  const hasAutoEvaluatedRef = useRef(false);
  useEffect(() => {
    // Only run if we have nodes, haven't run yet, and history is empty
    if (nodes.length > 0 && !hasAutoEvaluatedRef.current && accuracyHistory.length === 0) {
      hasAutoEvaluatedRef.current = true;
      // Small timeout to ensure everything is settled?
      // evaluateCurrentTree(); 
      // Actually, just calling it is fine.
      evaluateCurrentTree();
    }
  }, [nodes.length, accuracyHistory.length, evaluateCurrentTree]);

  return (
    <ReactFlow
      nodes={displayNodes}
      edges={displayEdges}
      onNodeClick={onNodeClick}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStart={onNodeDragStart}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
      nodesConnectable={false}
      minZoom={0.25}
    >

      <PerformanceMenu
        current={lastAccuracy}
        history={accuracyHistory}
        onEvaluate={evaluateCurrentTree}
        isEvaluating={isEvaluating}
      />

      <GraphMenu
        ref={graphMenuRef}
        style={{ transform: `scale(${scale})` }}
        nodes={nodes}
        edges={edges}
        onLayoutChange={handleLayoutChange}
        onFitView={handleFitView}
        onResetLayout={handleResetLayout}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        onUndo={undo}
        onRedo={redo}
        onResetTree={resetTree}
        historyInfo={historyInfo}
        isSaving={isSaving}
      />

      <NodeMenu
        ref={nodeMenuRef}
        style={{ transform: `scale(${scale})` }}
        onModify={handleModfifyNode}
        onAdd={handleAddNode}
        onMove={handleMove}
        onDelete={handleDelete}
        onCut={handleCut}
      />
      {isMoveMode && (
        <MoveModeBanner onCancel={() => setIsMoveMode(false)} />
      )}

      <Background variant={BackgroundVariant.Dots} color="#A5A5A5" />

      <ColorLegend colorMode={colorMode} />

    </ReactFlow>
  )
}

export function TreeCanvas() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <TreeCanvasComponent />
      </ReactFlowProvider>
    </div>
  )
}
