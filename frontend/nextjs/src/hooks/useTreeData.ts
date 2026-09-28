'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Node, type Edge } from '@xyflow/react';
import { layoutNodes } from '../utils/layoutNodes';
import { RawTreeNode, formatNodeLabel } from '../utils/treeUtils';


interface HistoryInfo {
    can_undo: boolean;
    can_redo: boolean;
    total_states: number;
    current_position: number;
}

// Browser requests go through the Next.js rewrite in next.config.ts.
const BACKEND_BASE_URL = '';

const fallbackTreeData: RawTreeNode = {
    node_id: 0,
    impurity: 0.48,
    n_node_samples: 100,
    value: [[0.5, 0.5]],
    feature: 'Placeholder Feature',
    threshold: 1,
    children: [
        {
            node_id: 1,
            impurity: 0.3,
            n_node_samples: 60,
            value: [[0.7, 0.3]],
            feature: 'Example Feature',
            threshold: 2,
            children: [
                {
                    node_id: 2,
                    impurity: 0.1,
                    n_node_samples: 40,
                    value: [[0.9, 0.1]],
                    class: 'No Disease'
                },
                {
                    node_id: 3,
                    impurity: 0.2,
                    n_node_samples: 20,
                    value: [[0.3, 0.7]],
                    class: 'Disease'
                }
            ]
        },
        {
            node_id: 4,
            impurity: 0.35,
            n_node_samples: 40,
            value: [[0.2, 0.8]],
            feature: 'Secondary Feature',
            threshold: 0.5,
            children: [
                {
                    node_id: 5,
                    impurity: 0.05,
                    n_node_samples: 30,
                    value: [[0.1, 0.9]],
                    class: 'Disease'
                },
                {
                    node_id: 6,
                    impurity: 0.15,
                    n_node_samples: 10,
                    value: [[0.8, 0.2]],
                    class: 'No Disease'
                }
            ]
        }
    ]
};


const processRaw = ( rawData: RawTreeNode ): { nodes: Node[]; edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const rootSamples = rawData.n_node_samples || 1;
    const MIN_WIDTH = 2;
    const MAX_WIDTH = 15;

    const traverse = ( node: RawTreeNode, isRoot: boolean, parentId?: string ) => {
        let currentId = node.node_id.toString();
        if ( isRoot ) {
            currentId += '_root'
        }

        nodes.push( {
            id: currentId,
            position: { x: 0, y: 0 },
            data: {
                label: formatNodeLabel( node ),
                meta: node,
            },
        } );

        if ( parentId ) {

            // Default "light shade of grey"
            const edgeColor = '#d6d8dc';

            const samples = node.n_node_samples ?? 0;
            const ratio = Math.min( Math.max( samples / rootSamples, 0 ), 1 );
            // Preserving user's custom width multiplier (* 3)
            const strokeWidth = MIN_WIDTH + ( MAX_WIDTH - MIN_WIDTH ) * ratio * 3;

            edges.push( {
                id: `${parentId}_${currentId}`,
                source: parentId,
                target: currentId,

                style: {
                    strokeWidth: strokeWidth,
                    stroke: edgeColor,
                    transition: 'stroke 0.3s ease', // Add transition for smooth toggle
                }
            } );
        }

        ( node.children ?? [] ).forEach( ( child ) => traverse( child, false, currentId ) );
    };

    traverse( rawData, true );

    return layoutNodes( nodes, edges );
};

/**
 * Convert React Flow nodes/edges back to RawTreeNode structure for saving.
 */
const nodesToRawTree = ( nodes: Node[], edges: Edge[] ): RawTreeNode | null => {
    if ( nodes.length === 0 ) return null;

    // Build adjacency map: parent -> children
    const childrenMap: Record<string, string[]> = {};
    edges.forEach( edge => {
        if ( !childrenMap[edge.source] ) {
            childrenMap[edge.source] = [];
        }
        childrenMap[edge.source].push( edge.target );
    } );

    // Find root node (ends with '_root' or has no parent)
    const targetIds = new Set( edges.map( e => e.target ) );
    const rootNode = nodes.find( n => n.id.endsWith( '_root' ) || !targetIds.has( n.id ) );

    if ( !rootNode ) return null;

    const buildTree = ( nodeId: string ): RawTreeNode => {
        const node = nodes.find( n => n.id === nodeId );
        if ( !node ) {
            throw new Error( `Node ${nodeId} not found` );
        }

        const meta = node.data?.meta as RawTreeNode | undefined;
        const childIds = childrenMap[nodeId] || [];

        // Build base node from meta or create placeholder
        const rawNode: RawTreeNode = {
            node_id: meta?.node_id ?? ( parseInt( nodeId.replace( '_root', '' ), 10 ) || 0 ),
            impurity: meta?.impurity ?? 0,
            n_node_samples: meta?.n_node_samples ?? 0,
            value: meta?.value ?? [[0.5, 0.5]],
        };

        if ( childIds.length > 0 || ( meta?.feature && typeof meta.feature === 'string' ) ) {
            // Internal node (or empty internal node)
            rawNode.feature = meta?.feature ?? 'Unknown';
            rawNode.threshold = meta?.threshold ?? 0;

            // Sort children strictly by visual X position to match backend (Left=Little, Right=Big)
            const sortedChildIds = [...childIds].sort( ( aId, bId ) => {
                const nodeA = nodes.find( n => n.id === aId );
                const nodeB = nodes.find( n => n.id === bId );
                return ( nodeA?.position.x ?? 0 ) - ( nodeB?.position.x ?? 0 );
            } );

            rawNode.children = sortedChildIds.map( childId => buildTree( childId ) );
        } else {
            // Leaf node
            rawNode.class = meta?.class ?? 'Unknown';
        }

        return rawNode;
    };

    return buildTree( rootNode.id );
};

export const useTreeData = () => {
    const [nodes, setNodes] = useState<Node[]>( [] );
    const [edges, setEdges] = useState<Edge[]>( [] );
    const [historyInfo, setHistoryInfo] = useState<HistoryInfo>( {
        can_undo: false,
        can_redo: false,
        total_states: 0,
        current_position: 0,
    } );
    const [isSaving, setIsSaving] = useState( false );

    // Fetch history info
    const fetchHistoryInfo = useCallback( async () => {
        try {
            const response = await fetch( `${BACKEND_BASE_URL}/tree/history` );
            if ( response.ok ) {
                const info = await response.json() as HistoryInfo;
                setHistoryInfo( info );
            }
        } catch ( error ) {
            console.error( 'Failed to fetch history info:', error );
        }
    }, [] );

    // Load tree and update display
    const loadTreeFromResponse = useCallback( ( rawTree: RawTreeNode ) => {
        const layoutedGraph = processRaw( rawTree );
        setNodes( layoutedGraph.nodes );
        setEdges( layoutedGraph.edges );
    }, [] );

    // Save current tree state to backend
    const saveTreeState = useCallback( async ( currentNodes: Node[], currentEdges: Edge[] ) => {
        if ( isSaving ) return;

        const rawTree = nodesToRawTree( currentNodes, currentEdges );
        if ( !rawTree ) {
            console.error( 'Failed to convert nodes to tree' );
            return;
        }

        setIsSaving( true );
        try {
            const response = await fetch( `${BACKEND_BASE_URL}/tree/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( { tree: rawTree } ),
            } );

            if ( !response.ok ) {
                throw new Error( `Save failed: ${response.status}` );
            }

            await fetchHistoryInfo();
        } catch ( error ) {
            console.error( 'Failed to save tree state:', error );
        } finally {
            setIsSaving( false );
        }
    }, [isSaving, fetchHistoryInfo] );

    // Undo
    const undo = useCallback( async () => {
        if ( !historyInfo.can_undo ) return;

        try {
            const response = await fetch( `${BACKEND_BASE_URL}/tree/undo`, {
                method: 'POST',
            } );

            if ( response.ok ) {
                const rawTree = await response.json() as RawTreeNode;
                loadTreeFromResponse( rawTree );
                await fetchHistoryInfo();
            }
        } catch ( error ) {
            console.error( 'Failed to undo:', error );
        }
    }, [historyInfo.can_undo, loadTreeFromResponse, fetchHistoryInfo] );

    // Redo
    const redo = useCallback( async () => {
        if ( !historyInfo.can_redo ) return;

        try {
            const response = await fetch( `${BACKEND_BASE_URL}/tree/redo`, {
                method: 'POST',
            } );

            if ( response.ok ) {
                const rawTree = await response.json() as RawTreeNode;
                loadTreeFromResponse( rawTree );
                await fetchHistoryInfo();
            }
        } catch ( error ) {
            console.error( 'Failed to redo:', error );
        }
    }, [historyInfo.can_redo, loadTreeFromResponse, fetchHistoryInfo] );

    // Reset to initial tree
    const resetTree = useCallback( async () => {
        try {
            const response = await fetch( `${BACKEND_BASE_URL}/tree/reset`, {
                method: 'POST',
            } );

            if ( response.ok ) {
                const rawTree = await response.json() as RawTreeNode;
                loadTreeFromResponse( rawTree );
                await fetchHistoryInfo();
            }
        } catch ( error ) {
            console.error( 'Failed to reset tree:', error );
        }
    }, [loadTreeFromResponse, fetchHistoryInfo] );

    // Reflow Tree (Recalculate stats)
    const reflowTree = useCallback( async ( currentNodes?: Node[], currentEdges?: Edge[] ) => {
        const nodesToUse = currentNodes || nodes;
        const edgesToUse = currentEdges || edges;

        const rawTree = nodesToRawTree( nodesToUse, edgesToUse );
        if ( !rawTree ) return;

        try {
            const response = await fetch( `${BACKEND_BASE_URL}/tree/reflow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( { tree: rawTree } ),
            } );

            if ( response.ok ) {
                const updatedRawTree = await response.json() as RawTreeNode;
                loadTreeFromResponse( updatedRawTree );
            }
        } catch ( error ) {
            console.error( 'Failed to reflow tree:', error );
        }
    }, [nodes, edges, loadTreeFromResponse] );

    // Initial load
    useEffect( () => {
        const controller = new AbortController();

        const loadTreeData = async () => {
            try {
                const response = await fetch( `${BACKEND_BASE_URL}/tree`, {
                    signal: controller.signal,
                } );

                if ( !response.ok ) {
                    throw new Error( `Unexpected status code: ${response.status}` );
                }

                const rawTree = await response.json() as RawTreeNode;
                loadTreeFromResponse( rawTree );
                await fetchHistoryInfo();

            } catch ( error ) {
                if ( controller.signal.aborted ) {
                    return;
                }

                console.error( 'Failed to fetch tree data; falling back to static data.', error );
                loadTreeFromResponse( fallbackTreeData );
            }
        };

        void loadTreeData();

        return () => controller.abort();
    }, [loadTreeFromResponse, fetchHistoryInfo] );


    //evaluate

    const [accuracyHistory, setAccuracyHistory] = useState<number[]>( [] );
    const [lastAccuracy, setLastAccuracy] = useState<number | null>( null );
    const [isEvaluating, setIsEvaluating] = useState( false );

    const evaluateCurrentTree = useCallback( async () => {
        if ( isEvaluating ) return;
        const rawTree = nodesToRawTree( nodes, edges );
        if ( !rawTree ) { console.error( 'Cannot evaluate empty tree' ); return; }

        setIsEvaluating( true );
        try {
            const res = await fetch( `/tree/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( { tree: rawTree } )
            } );
            if ( !res.ok ) {
                const err = await res.text();
                console.error( 'Evaluate failed', res.status, err );
                return;
            }
            const body = await res.json();
            const acc = typeof body.accuracy === 'number' ? body.accuracy : null;
            if ( acc != null ) {
                setLastAccuracy( acc );
                setAccuracyHistory( h => [...h.slice( -100 ), acc] ); // keep last 100
            } else {
                console.warn( 'Evaluate returned no accuracy:', body );
            }
        } catch ( err ) {
            console.error( 'Evaluate error', err );
        } finally {
            setIsEvaluating( false );
        }
    }, [nodes, edges, isEvaluating] );
    return {
        nodes,
        edges,
        setNodes,
        setEdges,
        // Persistence
        saveTreeState,
        undo,
        redo,
        resetTree,
        historyInfo,
        isSaving,
        // Evaluation
        evaluateCurrentTree,
        accuracyHistory,
        lastAccuracy,
        isEvaluating,
        reflowTree
    };
};
