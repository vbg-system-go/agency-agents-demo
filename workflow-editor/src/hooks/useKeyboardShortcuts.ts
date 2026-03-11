'use client';

import { useEffect } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { useEditorStore } from '@/store/editorStore';
import { exportWorkflowAsJson } from '@/lib/persistence';

export function useKeyboardShortcuts() {
  const { workflow, saveCurrentWorkflow, duplicateNodes, deleteNodes } = useWorkflowStore();
  const { selectedNodeIds, clearSelection } = useEditorStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const tag = (e.target as HTMLElement).tagName.toLowerCase();

      // Don't fire when typing in inputs
      if (['input', 'textarea', 'select'].includes(tag)) return;

      if (meta && e.key === 's') {
        e.preventDefault();
        saveCurrentWorkflow();
      }

      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useWorkflowStore.temporal.getState().undo();
      }

      if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        useWorkflowStore.temporal.getState().redo();
      }

      if (meta && e.key === 'd') {
        e.preventDefault();
        if (selectedNodeIds.length > 0) duplicateNodes(selectedNodeIds);
      }

      if (meta && e.key === 'e') {
        e.preventDefault();
        exportWorkflowAsJson(workflow);
      }

      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNodeIds, workflow, saveCurrentWorkflow, duplicateNodes, deleteNodes, clearSelection]);
}
