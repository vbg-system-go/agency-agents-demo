'use client';

import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toolbar } from './toolbar/Toolbar';
import { NodePalette } from './panels/NodePalette';
import { PropertiesPanel } from './panels/PropertiesPanel';
import { WorkflowCanvas } from './canvas/WorkflowCanvas';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function EditorInner() {
  useKeyboardShortcuts();

  return (
    <div className="flex flex-col h-screen bg-zinc-50 overflow-hidden">
      <Toolbar />
      <div className="flex flex-1 min-h-0">
        {/* Left: Node Palette */}
        <aside className="w-56 border-r border-zinc-200 bg-white flex flex-col shrink-0 overflow-hidden">
          <NodePalette />
        </aside>

        {/* Center: Canvas */}
        <main className="flex-1 relative overflow-hidden">
          <WorkflowCanvas />
        </main>

        {/* Right: Properties */}
        <aside className="w-72 border-l border-zinc-200 bg-white flex flex-col shrink-0 overflow-hidden">
          <PropertiesPanel />
        </aside>
      </div>
    </div>
  );
}

export function EditorLayout() {
  return (
    <TooltipProvider delayDuration={400}>
      <ReactFlowProvider>
        <EditorInner />
      </ReactFlowProvider>
    </TooltipProvider>
  );
}
