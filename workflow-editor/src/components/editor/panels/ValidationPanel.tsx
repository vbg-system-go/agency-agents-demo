'use client';

import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '@/store/workflowStore';
import { validateWorkflow } from '@/lib/validation';

export function ValidationPanel() {
  const { workflow, runValidation } = useWorkflowStore();
  const [expanded, setExpanded] = useState(false);

  const errors = validateWorkflow(workflow);
  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;
  const isValid = errorCount === 0;

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Validation
        </p>
        <Button variant="ghost" size="icon-sm" onClick={runValidation} title="Re-run validation">
          <ShieldCheck className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Summary */}
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
          isValid
            ? 'bg-emerald-50 text-emerald-700'
            : errorCount > 0
            ? 'bg-red-50 text-red-700'
            : 'bg-amber-50 text-amber-700'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        {isValid ? (
          <CheckCircle2 className="h-4 w-4 shrink-0" />
        ) : errorCount > 0 ? (
          <AlertCircle className="h-4 w-4 shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0" />
        )}
        <span className="text-xs font-medium flex-1">
          {isValid
            ? 'Flow is valid'
            : `${errorCount} error${errorCount !== 1 ? 's' : ''}${warningCount > 0 ? `, ${warningCount} warning${warningCount !== 1 ? 's' : ''}` : ''}`}
        </span>
        {errors.length > 0 && (
          expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Error list */}
      {expanded && errors.length > 0 && (
        <div className="space-y-1.5">
          {errors.map((err, i) => (
            <div
              key={i}
              className={`rounded-md px-3 py-2 text-xs ${
                err.severity === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}
            >
              <div className="flex items-start gap-1.5">
                {err.severity === 'error' ? (
                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                )}
                <span>{err.message}</span>
              </div>
              {err.nodeId && (
                <p className="mt-1 text-[10px] opacity-70">Node: {err.nodeId.slice(0, 8)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
