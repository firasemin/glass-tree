'use client';

import { ReactFlow, Background, BackgroundVariant, useNodesState, useEdgesState, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect } from 'react';

// Generate a DNA Helix structure
const generateDNAHelix = () => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const numSteps = 60;     // Increased length to cover more diagonal space
  const verticalGap = 60;
  const amplitude = 800;   // Massive width to fill screen
  const frequency = 0.10;  // Very slow, majestic twist
  const yOffsetStart = -1500;

  // Rotation angle in radians 
  const rotation = -Math.PI / 6;
  const cosRot = Math.cos(rotation);
  const sinRot = Math.sin(rotation);

  for (let i = 0; i < numSteps; i++) {
    const rawY = yOffsetStart + i * verticalGap;
    const angle = i * frequency;

    // Base positions before rotation
    const baseX1 = amplitude * Math.sin(angle);
    const baseX2 = amplitude * Math.sin(angle + Math.PI);
    const z1 = Math.cos(angle);
    const z2 = Math.cos(angle + Math.PI);

    // Apply 2D Rotation
    const x1 = baseX1 * cosRot - rawY * sinRot;
    const y1 = baseX1 * sinRot + rawY * cosRot;

    const x2 = baseX2 * cosRot - rawY * sinRot;
    const y2 = baseX2 * sinRot + rawY * cosRot;

    // Enhanced 3D Effect Factors
    const getScale = (z: number) => 0.8 + (z * 0.6);
    // Stronger Opacity: Min 0.3, Max 1.0
    const getOpacity = (z: number) => 0.3 + (z * 0.35) + 0.35;

    // Uniform Color
    const NODE_COLOR = '#ffffff';

    // Strand 1 Node
    const id1 = `s1-${i}`;
    nodes.push({
      id: id1,
      position: { x: x1, y: y1 },
      data: { label: '' },
      className: 'ghost-node',
      style: {
        width: 70 * getScale(z1), // Bigger base size
        height: 70 * getScale(z1),
        borderRadius: '25%',
        opacity: getOpacity(z1),
        zIndex: Math.floor(z1 * 100),
        backgroundColor: NODE_COLOR,
        boxShadow: z1 > 0.5 ? '0 0 20px rgba(255,255,255,0.6)' : 'none',
        transition: 'all 0.3s ease'
      }
    });

    // Strand 2 Node
    const id2 = `s2-${i}`;
    nodes.push({
      id: id2,
      position: { x: x2, y: y2 },
      data: { label: '' },
      className: 'ghost-node',
      style: {
        width: 70 * getScale(z2),
        height: 70 * getScale(z2),
        borderRadius: '25%',
        opacity: getOpacity(z2),
        zIndex: Math.floor(z2 * 100),
        backgroundColor: NODE_COLOR,
        boxShadow: z2 > 0.5 ? '0 0 20px rgba(255, 255, 255, 0.6)' : 'none',
        transition: 'all 0.3s ease'
      }
    });

    // Edges: Backbone
    if (i > 0) {
      edges.push({
        id: `backbone-s1-${i}`,
        source: `s1-${i - 1}`,
        target: id1,
        style: { stroke: '#ccc', strokeWidth: 8 * getScale(z1), opacity: getOpacity(z1) * 0.6 }
      });
      edges.push({
        id: `backbone-s2-${i}`,
        source: `s2-${i - 1}`,
        target: id2,
        style: { stroke: '#ccc', strokeWidth: 8 * getScale(z2), opacity: getOpacity(z2) * 0.6 }
      });
    }

    // Edges: Base Pairs
    edges.push({
      id: `pair-${i}`,
      source: id1,
      target: id2,
      animated: false,
      style: {
        stroke: '#888', // Slightly stronger color
        strokeWidth: 3,
        opacity: 0.4,
        strokeDasharray: '6,6'
      }
    });
  }

  return { nodes, edges };
};

const { nodes: initialNodes, edges: initialEdges } = generateDNAHelix();

export function BackgroundTree() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: -1, pointerEvents: 'none' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        // Force a specific view that is "zoomed in"
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.2}
        maxZoom={4}
        fitView
        // Force it to be cropped (minZoom 0.6 ensures it doesn't zoom out too far)
        fitViewOptions={{ minZoom: 0.6, maxZoom: 1.2 }}
        panOnScroll={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={true}
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="#777" gap={40} size={2} />
      </ReactFlow>
    </div>
  );
}