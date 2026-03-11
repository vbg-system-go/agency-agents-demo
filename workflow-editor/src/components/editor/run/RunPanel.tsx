'use client';

import React, { useRef, useEffect } from 'react';
import {
  Play, ChevronDown, ChevronUp, Loader2,
  CheckCircle2, AlertCircle, Circle, RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useRunStore } from '@/store/runStore';
import { useWorkflowStore } from '@/store/workflowStore';
import type { NodeStatus } from '@/lib/executor';
import type { ExecutionEvent } from '@/lib/executor';
import type { LLMProvider, OutputConfig } from '@/types';

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: NodeStatus }) {
  if (status === 'running') return <Loader2 className="h-3.5 w-3.5 text-violet-500 animate-spin shrink-0" />;
  if (status === 'done') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
  if (status === 'error') return <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />;
  return <Circle className="h-3.5 w-3.5 text-zinc-300 shrink-0" />;
}

// ─── Output result card (for output-type nodes) ───────────────────────────────

function OutputResultCard({ nodeId }: { nodeId: string }) {
  const state = useRunStore((s) => s.nodeStates[nodeId]);
  const node = useWorkflowStore((s) => s.workflow.nodes.find((n) => n.id === nodeId));
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.status === 'running') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state?.output, state?.status]);

  if (!node) return null;

  const cfg = node.data.config as Partial<OutputConfig>;
  const label = cfg.label || node.data.label || 'Output';
  const outputType = cfg.outputType ?? 'text';

  const status: NodeStatus = state?.status ?? 'pending';

  // Render the output body with type-aware formatting
  let body: React.ReactNode = null;
  if (state?.error) {
    body = <p className="text-xs text-red-500">{state.error}</p>;
  } else if (state?.output) {
    if (outputType === 'json') {
      // Strip markdown code fences if the model wrapped the JSON
      let raw = state.output.trim();
      const fenceMatch = raw.match(/^```(?:json)?\s*([\s\S]*?)```$/);
      if (fenceMatch) raw = fenceMatch[1].trim();

      try {
        const parsed = JSON.parse(raw);
        body = (
          <pre className="text-xs text-zinc-700 font-mono leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      } catch {
        body = (
          <>
            <p className="text-[10px] text-amber-500 mb-1.5">Could not parse as JSON — showing raw output</p>
            <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed">{state.output}</pre>
          </>
        );
      }
    } else {
      body = (
        <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed">
          {state.output}
        </pre>
      );
    }
  }

  return (
    <div className={cn(
      'rounded-lg border bg-white overflow-hidden',
      status === 'running' && 'border-blue-300 shadow-sm shadow-blue-100',
      status === 'done' && 'border-blue-200',
      status === 'error' && 'border-red-200',
      status === 'pending' && 'border-zinc-200 opacity-50',
    )}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-inherit bg-blue-50/40">
        <StatusBadge status={status} />
        <span className="text-xs font-semibold text-zinc-700 truncate">{label}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-blue-500 font-semibold shrink-0">
          {outputType}
        </span>
      </div>
      {body && (
        <div className="px-3 py-2.5 max-h-64 overflow-y-auto">
          {body}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

// ─── Processing node card (agents, tools, etc.) ────────────────────────────────

function NodeOutputCard({ nodeId }: { nodeId: string }) {
  const state = useRunStore((s) => s.nodeStates[nodeId]);
  const node = useWorkflowStore((s) => s.workflow.nodes.find((n) => n.id === nodeId));
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.status === 'running') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state?.output, state?.status]);

  if (!node || !state) return null;

  const label = node.data.label;
  const nodeType = node.data.nodeType;

  const cfg = node.data.config as { provider?: LLMProvider; model?: string };
  const modelTag = nodeType === 'agent' ? `${cfg.provider ?? 'anthropic'} · ${cfg.model ?? '—'}` : null;

  return (
    <div className={cn(
      'rounded-lg border bg-white overflow-hidden',
      state.status === 'running' && 'border-violet-300 shadow-sm shadow-violet-100',
      state.status === 'done' && 'border-emerald-200',
      state.status === 'error' && 'border-red-200',
      state.status === 'pending' && 'border-zinc-200 opacity-50',
    )}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-inherit bg-zinc-50/50">
        <StatusBadge status={state.status} />
        <span className="text-xs font-semibold text-zinc-700 truncate">{label}</span>
        {modelTag && (
          <span className="ml-1 text-[10px] text-zinc-400 truncate">{modelTag}</span>
        )}
        <span className="ml-auto text-[10px] text-zinc-400 font-medium uppercase tracking-wide shrink-0">{nodeType}</span>
      </div>
      {(state.output || state.error) && (
        <div className="px-3 py-2.5 max-h-64 overflow-y-auto">
          {state.error ? (
            <p className="text-xs text-red-500">{state.error}</p>
          ) : (
            <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed">
              {state.output}
            </pre>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function RunPanel() {
  const {
    isOpen, isRunning, userInputs, nodeStates,
    openPanel, closePanel, setUserInput, resetRun,
    setNodeStatus, appendNodeChunk, setNodeDone, setNodeError, setRunning,
  } = useRunStore();

  const workflow = useWorkflowStore((s) => s.workflow);

  const inputNodes = workflow.nodes.filter((n) => n.data.nodeType === 'input');
  const outputNodes = workflow.nodes.filter((n) => n.data.nodeType === 'output');
  const processingNodes = workflow.nodes.filter(
    (n) => n.data.nodeType !== 'input' && n.data.nodeType !== 'output',
  );
  const hasNodes = workflow.nodes.length > 0;

  // If the workflow has explicit output nodes, show those as the result.
  // Otherwise fall back to showing the processing nodes directly.
  const hasOutputNodes = outputNodes.length > 0;

  const handleRun = async () => {
    resetRun();
    setRunning(true);

    for (const node of workflow.nodes) {
      setNodeStatus(node.id, 'pending');
    }

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow,
          inputs: userInputs,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? 'Run failed');
        setRunning(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          const event: ExecutionEvent = JSON.parse(raw);

          if (event.type === 'node_start' && event.nodeId) {
            setNodeStatus(event.nodeId, 'running');
          } else if (event.type === 'node_chunk' && event.nodeId && event.text) {
            appendNodeChunk(event.nodeId, event.text);
          } else if (event.type === 'node_done' && event.nodeId) {
            setNodeDone(event.nodeId, event.output ?? '');
          } else if (event.type === 'node_error' && event.nodeId) {
            setNodeError(event.nodeId, event.message ?? 'Error');
          } else if (event.type === 'workflow_error') {
            alert(`Workflow error: ${event.message}`);
          }
        }
      }
    } catch (err) {
      console.error('Run failed:', err);
    } finally {
      setRunning(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="border-t border-zinc-200 bg-white px-4 py-2 flex items-center gap-3 shrink-0">
        <button
          onClick={openPanel}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors"
        >
          <Play className="h-3.5 w-3.5" />
          Run workflow
        </button>
        <span className="text-xs text-zinc-400">
          {hasNodes ? `${workflow.nodes.length} nodes` : 'Add nodes to get started'}
        </span>
        <div className="flex-1" />
        <button onClick={openPanel} className="text-zinc-400 hover:text-zinc-600">
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-200 bg-zinc-50 flex flex-col shrink-0" style={{ height: '340px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-200 bg-white shrink-0">
        <Play className="h-4 w-4 text-violet-600" />
        <span className="text-sm font-semibold text-zinc-800">Run workflow</span>
        <div className="flex-1" />
        {Object.keys(nodeStates).length > 0 && (
          <button
            onClick={resetRun}
            disabled={isRunning}
            title="Clear results"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-500 text-xs font-medium transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
        <button
          onClick={handleRun}
          disabled={isRunning || !hasNodes}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
        >
          {isRunning
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running…</>
            : <><Play className="h-3.5 w-3.5" /> Run</>
          }
        </button>
        <button onClick={closePanel} className="text-zinc-400 hover:text-zinc-600 ml-1">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 divide-x divide-zinc-200">

        {/* Left: inputs */}
        <div className="w-72 shrink-0 flex flex-col gap-3 p-3 overflow-y-auto">
          {inputNodes.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Inputs
              </p>
              <div className="space-y-2">
                {inputNodes.map((node) => {
                  const cfg = node.data.config as { label?: string; description?: string };
                  return (
                    <div key={node.id}>
                      <label className="text-xs font-medium text-zinc-600 block mb-0.5">
                        {cfg.label || node.data.label}
                      </label>
                      {cfg.description && (
                        <p className="text-[10px] text-zinc-400 mb-1">{cfg.description}</p>
                      )}
                      <textarea
                        rows={3}
                        placeholder={`Enter ${cfg.label ?? 'input'}…`}
                        value={userInputs[node.id] ?? ''}
                        onChange={(e) => setUserInput(node.id, e.target.value)}
                        className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-300 focus:border-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-100 resize-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {inputNodes.length === 0 && (
            <p className="text-xs text-zinc-400 italic">Add input nodes to get started.</p>
          )}
        </div>

        {/* Right: results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {!hasOutputNodes && processingNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-zinc-400">Add agent and output nodes to see results here.</p>
            </div>
          ) : hasOutputNodes ? (
            // Workflow has explicit output nodes — show those as the result
            outputNodes.map((node) => (
              <OutputResultCard key={node.id} nodeId={node.id} />
            ))
          ) : (
            // No output nodes — fall back to showing processing nodes directly
            processingNodes.map((node) => (
              <NodeOutputCard key={node.id} nodeId={node.id} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
