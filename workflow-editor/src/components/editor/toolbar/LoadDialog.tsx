'use client';

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '@/store/workflowStore';
import { deleteWorkflow, importWorkflowFromJson } from '@/lib/persistence';
import { FileJson, Trash2, Clock } from 'lucide-react';
import { EXAMPLE_WORKFLOW, SIMPLE_WORKFLOW } from '@/data/seeds/example-workflows';
import { nanoid } from 'nanoid';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LoadDialog({ open, onClose }: Props) {
  const { savedWorkflows, loadWorkflowById, loadSavedWorkflows, setWorkflow } = useWorkflowStore();

  useEffect(() => {
    if (open) loadSavedWorkflows();
  }, [open, loadSavedWorkflows]);

  const handleLoad = async (id: string) => {
    await loadWorkflowById(id);
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteWorkflow(id);
    loadSavedWorkflows();
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const wf = await importWorkflowFromJson(file);
      setWorkflow({ ...wf, id: nanoid() });
      onClose();
    };
    input.click();
  };

  const loadExample = (wf: typeof EXAMPLE_WORKFLOW) => {
    setWorkflow({ ...wf, id: nanoid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Open Workflow</DialogTitle>
          <DialogDescription>Load a saved workflow or start from an example.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Examples */}
          <section>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Examples</p>
            <div className="space-y-1.5">
              {[EXAMPLE_WORKFLOW, SIMPLE_WORKFLOW].map((wf) => (
                <button
                  key={wf.id}
                  onClick={() => loadExample(wf)}
                  className="w-full flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-left hover:border-violet-200 hover:bg-violet-50 transition-colors"
                >
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-violet-100 shrink-0">
                    <FileJson className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{wf.name}</p>
                    <p className="text-xs text-zinc-400">{wf.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Saved workflows */}
          {savedWorkflows.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Saved</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {savedWorkflows.map((wf) => (
                  <button
                    key={wf.id}
                    onClick={() => handleLoad(wf.id)}
                    className="w-full flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-left hover:border-violet-200 hover:bg-violet-50 transition-colors group"
                  >
                    <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-200 shrink-0">
                      <FileJson className="h-4 w-4 text-zinc-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">{wf.name}</p>
                      <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock className="h-3 w-3" />
                        {new Date(wf.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 hover:text-red-600"
                      onClick={(e) => handleDelete(wf.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Import */}
          <div className="border-t border-zinc-100 pt-3">
            <Button variant="outline" size="sm" className="w-full" onClick={handleImport}>
              <FileJson className="h-4 w-4" />
              Import JSON file
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
