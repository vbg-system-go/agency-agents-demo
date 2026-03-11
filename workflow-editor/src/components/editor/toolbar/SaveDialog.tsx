'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkflowStore } from '@/store/workflowStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SaveDialog({ open, onClose }: Props) {
  const { workflow, updateWorkflowMeta, saveCurrentWorkflow } = useWorkflowStore();

  const handleSave = async () => {
    await saveCurrentWorkflow();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Workflow</DialogTitle>
          <DialogDescription>Give your workflow a name before saving.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Input
            label="Workflow Name"
            value={workflow.name}
            onChange={(e) => updateWorkflowMeta({ name: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
