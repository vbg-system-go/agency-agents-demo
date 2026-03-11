'use client';

import React from 'react';
import { Settings, Info } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { useEditorStore } from '@/store/editorStore';
import { NodePropertiesForm } from './NodePropertiesForm';
import { WorkflowMetaForm } from './WorkflowMetaForm';
import { ValidationPanel } from './ValidationPanel';

export function PropertiesPanel() {
  const { workflow } = useWorkflowStore();
  const { selectedNodeIds } = useEditorStore();

  const selectedNode = selectedNodeIds.length === 1
    ? workflow.nodes.find((n) => n.id === selectedNodeIds[0])
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Settings className="h-3.5 w-3.5 text-zinc-400" />
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {selectedNode ? 'Properties' : 'Workflow'}
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedNode ? (
          <NodePropertiesForm node={selectedNode} />
        ) : (
          <div className="space-y-0">
            <WorkflowMetaForm />
            <div className="border-t border-zinc-100">
              <ValidationPanel />
            </div>
          </div>
        )}
      </div>

      {/* Multi-selection state */}
      {selectedNodeIds.length > 1 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4">
          <Info className="h-8 w-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-500 text-center">
            {selectedNodeIds.length} nodes selected
          </p>
          <p className="text-xs text-zinc-400 text-center">
            Select a single node to edit its properties
          </p>
        </div>
      )}
    </div>
  );
}
