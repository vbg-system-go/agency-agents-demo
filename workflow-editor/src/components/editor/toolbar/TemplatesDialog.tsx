'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/store/workflowStore';
import { WORKFLOW_TEMPLATES } from '@/data/templates';
import { nanoid } from 'nanoid';
import { Bot, Network, Database, Shield } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Support: Bot,
  Integration: Network,
  Research: Database,
  Moderation: Shield,
};

export function TemplatesDialog({ open, onClose }: Props) {
  const { setWorkflow } = useWorkflowStore();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedTemplate = WORKFLOW_TEMPLATES.find((t) => t.id === selected);

  const handleUse = () => {
    if (!selectedTemplate) return;
    const now = new Date().toISOString();
    setWorkflow({
      ...selectedTemplate.workflow,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    });
    onClose();
  };

  const categories = [...new Set(WORKFLOW_TEMPLATES.map((t) => t.category))];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Templates</DialogTitle>
          <DialogDescription>
            Start from a pre-built workflow template. All templates can be fully customized.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-2 max-h-96 overflow-y-auto">
          {categories.map((category) => (
            <div key={category} className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{category}</p>
              {WORKFLOW_TEMPLATES.filter((t) => t.category === category).map((tpl) => {
                const Icon = CATEGORY_ICONS[tpl.category] ?? Bot;
                const isSelected = selected === tpl.id;

                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelected(tpl.id)}
                    className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-violet-400 bg-violet-50 shadow-sm'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-violet-200' : 'bg-zinc-100'}`}>
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-violet-600' : 'text-zinc-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800">{tpl.name}</p>
                      <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{tpl.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {tpl.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="default" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 pt-4 mt-2">
          {selectedTemplate ? (
            <p className="text-sm text-zinc-600">
              <span className="font-medium">{selectedTemplate.name}</span> selected ·{' '}
              {selectedTemplate.workflow.nodes.length} nodes
            </p>
          ) : (
            <p className="text-sm text-zinc-400">Select a template to preview</p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleUse} disabled={!selected}>
              Use Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
