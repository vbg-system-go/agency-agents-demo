'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useWorkflowStore } from '@/store/workflowStore';

export function WorkflowMetaForm() {
  const { workflow, updateWorkflowMeta } = useWorkflowStore();

  return (
    <div className="px-4 py-4 space-y-3">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Workflow Details
      </p>
      <Input
        label="Name"
        value={workflow.name}
        onChange={(e) => updateWorkflowMeta({ name: e.target.value })}
        placeholder="My Workflow"
      />
      <Textarea
        label="Description"
        value={workflow.description}
        onChange={(e) => updateWorkflowMeta({ description: e.target.value })}
        placeholder="What does this workflow do?"
        className="min-h-[70px]"
      />
      <Input
        label="Tags (comma-separated)"
        value={workflow.tags.join(', ')}
        onChange={(e) =>
          updateWorkflowMeta({
            tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
          })
        }
        placeholder="agent, support, automation"
      />
      <div className="text-[10px] text-zinc-400 space-y-0.5 pt-1">
        <p>Nodes: {workflow.nodes.filter(n => n.type !== 'group').length} · Edges: {workflow.edges.length}</p>
        <p>ID: {workflow.id.slice(0, 12)}…</p>
        <p>Updated: {new Date(workflow.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
