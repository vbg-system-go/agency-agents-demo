'use client';

import React, { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionLineType,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type Edge,
  type Node,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '@/store/workflowStore';
import { useEditorStore } from '@/store/editorStore';
import { nodeTypes } from '@/components/editor/nodes';
import { CustomEdge } from './CustomEdge';
import { CanvasEmptyState } from './CanvasEmptyState';
import { NODE_TYPE_REGISTRY } from '@/types/node-registry';
import type { WorkflowNodeData } from '@/types';

const edgeTypes = {
  default: CustomEdge,
};

// Typed ReactFlow node using our data structure
type FlowNode = Node<WorkflowNodeData>;

export function WorkflowCanvas() {
  const { workflow, addNode, setNodes, setEdges, addEdge } = useWorkflowStore();
  const {
    setSelectedNodes,
    setSelectedEdges,
    showMiniMap,
    showGrid,
  } = useEditorStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      const updated = applyNodeChanges(changes, workflow.nodes as FlowNode[]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setNodes(updated as any);

      const selectedIds = updated
        .filter((n) => n.selected)
        .map((n) => n.id);
      setSelectedNodes(selectedIds);
    },
    [workflow.nodes, setNodes, setSelectedNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, workflow.edges as Edge[]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEdges(updated as any);

      const selectedIds = updated
        .filter((e) => e.selected)
        .map((e) => e.id);
      setSelectedEdges(selectedIds);
    },
    [workflow.edges, setEdges, setSelectedEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      addEdge({
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        animated: false,
        type: 'default',
      });
    },
    [addEdge]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const rect = reactFlowWrapper.current?.getBoundingClientRect();
      if (!rect) return;

      const rfViewport = reactFlowWrapper.current?.querySelector('.react-flow__viewport');
      if (!rfViewport) return;

      const transform = window.getComputedStyle(rfViewport).transform;
      const matrix = new DOMMatrix(transform);

      const x = (event.clientX - rect.left - matrix.e) / matrix.a;
      const y = (event.clientY - rect.top - matrix.f) / matrix.d;

      // Pre-defined agent from library
      const agentJson = event.dataTransfer.getData('application/reactflow-agent');
      if (agentJson) {
        try {
          const agent = JSON.parse(agentJson);
          addNode('agent', { x: x - 90, y: y - 40 }, {
            label: `${agent.emoji} ${agent.name}`,
            config: { systemPrompt: agent.systemPrompt },
          });
          return;
        } catch {
          // fall through to regular drop
        }
      }

      const nodeType = event.dataTransfer.getData('application/reactflow-node-type');
      if (!nodeType || !NODE_TYPE_REGISTRY[nodeType]) return;

      addNode(nodeType, { x: x - 90, y: y - 40 });
    },
    [addNode]
  );

  const miniMapNodeColor = useCallback((node: Node) => {
    const data = node.data as { nodeType?: string };
    const def = data.nodeType ? NODE_TYPE_REGISTRY[data.nodeType] : null;
    const colorMap: Record<string, string> = {
      violet: '#7c3aed', emerald: '#059669', blue: '#2563eb',
      amber: '#d97706', orange: '#ea580c', cyan: '#0891b2',
      purple: '#7c3aed', teal: '#0d9488', indigo: '#4f46e5',
      rose: '#e11d48', sky: '#0284c7', slate: '#64748b',
    };
    return def ? (colorMap[def.color] ?? '#94a3b8') : '#94a3b8';
  }, []);

  const isEmpty = workflow.nodes.length === 0;

  const rfNodes = useMemo(() => workflow.nodes as FlowNode[], [workflow.nodes]);
  const rfEdges = useMemo(() => workflow.edges as Edge[], [workflow.edges]);

  return (
    <div ref={reactFlowWrapper} className="relative w-full h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#6d28d9', strokeWidth: 2, strokeDasharray: '6 3' }}
        defaultViewport={workflow.viewport}
        fitView={isEmpty}
        snapToGrid={showGrid}
        snapGrid={[16, 16]}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        panOnDrag={[1, 2]}
        selectNodesOnDrag={false}
        proOptions={{ hideAttribution: true }}
        className="bg-zinc-50"
      >
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color="#d4d4d8"
          />
        )}
        <Controls
          position="bottom-right"
          className="!shadow-md !rounded-xl !border !border-zinc-200 !bg-white overflow-hidden"
          showInteractive={false}
        />
        {showMiniMap && (
          <MiniMap
            position="bottom-left"
            nodeColor={miniMapNodeColor}
            className="!rounded-xl !border !border-zinc-200 !shadow-md"
            maskColor="rgba(250, 250, 250, 0.8)"
          />
        )}
        {isEmpty && (
          <Panel position="top-left" className="pointer-events-none w-full h-full">
            <CanvasEmptyState />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
