'use client';

import React, { useState } from 'react';
import {
  Save, FolderOpen, Plus, Undo2, Redo2, Copy, Trash2,
  Grid3x3, Map, Download, Layers, GitBranch, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useWorkflowStore } from '@/store/workflowStore';
import { useEditorStore } from '@/store/editorStore';
import { useUndoRedo } from '@/hooks/useTemporalStore';
import { SaveDialog } from './SaveDialog';
import { LoadDialog } from './LoadDialog';
import { TemplatesDialog } from './TemplatesDialog';
import { exportWorkflowAsJson } from '@/lib/persistence';

export function Toolbar() {
  const { workflow, newWorkflow, saveCurrentWorkflow, deleteNodes, duplicateNodes, runValidation } = useWorkflowStore();
  const { selectedNodeIds, showMiniMap, showGrid, toggleMiniMap, toggleGrid, isDirty } = useEditorStore();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  const [showSave, setShowSave] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSave = async () => {
    await saveCurrentWorkflow();
  };

  const handleExport = () => {
    exportWorkflowAsJson(workflow);
  };

  return (
    <>
      <div className="flex items-center h-12 px-4 border-b border-zinc-200 bg-white gap-2 shrink-0">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 mr-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
            <GitBranch className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-zinc-800 hidden sm:block">
            AgentFlow
          </span>
        </div>

        <div className="w-px h-5 bg-zinc-200 mx-1" />

        {/* Workflow name */}
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-sm font-medium text-zinc-700 truncate max-w-[200px]">
            {workflow.name}
          </span>
          {isDirty && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
          )}
        </div>

        <div className="w-px h-5 bg-zinc-200 mx-1" />

        {/* File operations */}
        <div className="flex items-center gap-1">
          <ToolbarButton icon={Plus} label="New workflow" onClick={() => newWorkflow()} />
          <ToolbarButton icon={FolderOpen} label="Open workflow" onClick={() => setShowLoad(true)} />
          <ToolbarButton
            icon={Save}
            label="Save (⌘S)"
            onClick={handleSave}
            className={isDirty ? 'text-violet-600' : ''}
          />
          <ToolbarButton icon={Download} label="Export JSON" onClick={handleExport} />
        </div>

        <div className="w-px h-5 bg-zinc-200 mx-1" />

        {/* Edit operations */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={Undo2}
            label="Undo (⌘Z)"
            onClick={undo}
            disabled={!canUndo}
          />
          <ToolbarButton
            icon={Redo2}
            label="Redo (⌘⇧Z)"
            onClick={redo}
            disabled={!canRedo}
          />
        </div>

        {selectedNodeIds.length > 0 && (
          <>
            <div className="w-px h-5 bg-zinc-200 mx-1" />
            <div className="flex items-center gap-1">
              <ToolbarButton
                icon={Copy}
                label="Duplicate (⌘D)"
                onClick={() => duplicateNodes(selectedNodeIds)}
              />
              <ToolbarButton
                icon={Trash2}
                label="Delete selected"
                onClick={() => deleteNodes(selectedNodeIds)}
                className="text-red-500 hover:bg-red-50"
              />
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* View toggles */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={Grid3x3}
            label="Toggle grid"
            onClick={toggleGrid}
            active={showGrid}
          />
          <ToolbarButton
            icon={Map}
            label="Toggle minimap"
            onClick={toggleMiniMap}
            active={showMiniMap}
          />
        </div>

        <div className="w-px h-5 bg-zinc-200 mx-1" />

        {/* Templates */}
        <Button variant="ghost" size="sm" onClick={() => setShowTemplates(true)}>
          <Layers className="h-4 w-4" />
          <span className="hidden sm:block">Templates</span>
        </Button>

        {/* Validate */}
        <Button variant="ghost" size="sm" onClick={runValidation}>
          <Zap className="h-4 w-4" />
          <span className="hidden sm:block">Validate</span>
        </Button>
      </div>

      {/* Dialogs */}
      <SaveDialog open={showSave} onClose={() => setShowSave(false)} />
      <LoadDialog open={showLoad} onClose={() => setShowLoad(false)} />
      <TemplatesDialog open={showTemplates} onClose={() => setShowTemplates(false)} />
    </>
  );
}

interface ToolbarButtonProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
}

function ToolbarButton({ icon: Icon, label, onClick, disabled, active, className }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150 ${
            active
              ? 'bg-violet-100 text-violet-600'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
          } disabled:opacity-40 disabled:cursor-not-allowed ${className ?? ''}`}
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
