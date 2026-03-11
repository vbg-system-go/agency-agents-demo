'use client';

import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  AlertCircle,
  AlertTriangle,
  Bot, LogIn, LogOut, GitBranch, Network, Wrench,
  Database, Globe, MessageSquare, UserCheck, RefreshCw,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { NODE_TYPE_REGISTRY } from '@/types/node-registry';
import type { WorkflowNodeData } from '@/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Bot, LogIn, LogOut, GitBranch, Network, Wrench,
  Database, Globe, MessageSquare, UserCheck, RefreshCw, Square,
};

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; handle: string }> = {
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-600', handle: 'bg-violet-500' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', handle: 'bg-emerald-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', handle: 'bg-blue-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', handle: 'bg-amber-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', handle: 'bg-orange-500' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', icon: 'text-cyan-600', handle: 'bg-cyan-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', handle: 'bg-purple-500' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600', handle: 'bg-teal-500' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600', handle: 'bg-indigo-500' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600', handle: 'bg-rose-500' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-200', icon: 'text-sky-600', handle: 'bg-sky-500' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-600', handle: 'bg-slate-400' },
};

interface WorkflowNodeProps extends NodeProps {
  data: WorkflowNodeData;
}

export function NodeWrapper({ data, selected, id }: WorkflowNodeProps) {
  const def = NODE_TYPE_REGISTRY[data.nodeType];
  if (!def) return null;

  const colors = COLOR_MAP[def.color] ?? COLOR_MAP.slate;
  const Icon = ICON_MAP[def.icon] ?? Bot;
  const hasErrors = data.validation?.errors.some((e) => e.severity === 'error');
  const hasWarnings = data.validation?.errors.some((e) => e.severity === 'warning');

  const positionMap: Record<string, Position> = {
    top: Position.Top,
    bottom: Position.Bottom,
    left: Position.Left,
    right: Position.Right,
  };

  return (
    <div
      className={cn(
        'relative min-w-[180px] rounded-xl border-2 bg-white shadow-sm transition-all duration-150',
        colors.border,
        selected && 'ring-2 ring-violet-400 ring-offset-2 shadow-md',
        hasErrors && 'border-red-400',
        hasWarnings && !hasErrors && 'border-amber-400'
      )}
    >
      {/* Handles */}
      {def.handles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={handle.type}
          position={positionMap[handle.position]}
          className={cn(
            '!w-3 !h-3 !rounded-full !border-2 !border-white transition-all duration-150',
            '!hover:scale-125',
            colors.handle
          )}
          title={handle.label}
        />
      ))}

      {/* Header */}
      <div className={cn('flex items-center gap-2.5 rounded-t-xl px-3 py-2.5', colors.bg)}>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', colors.bg)}>
          <Icon className={cn('h-4 w-4', colors.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-800 truncate">{data.label}</p>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wide">{def.label}</p>
        </div>
        {hasErrors && <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
        {hasWarnings && !hasErrors && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
      </div>

      {/* Body - node type specific summary */}
      <NodeBody data={data} />

      {/* Notes */}
      {data.notes && (
        <div className="border-t border-zinc-100 px-3 py-1.5">
          <p className="text-[11px] text-zinc-400 italic truncate">{data.notes}</p>
        </div>
      )}
    </div>
  );
}

function NodeBody({ data }: { data: WorkflowNodeData }) {
  const config = data.config as Record<string, unknown>;

  const summaryLine = getNodeSummary(data.nodeType, config);
  if (!summaryLine) return null;

  return (
    <div className="px-3 py-2">
      <p className="text-[11px] text-zinc-500 truncate">{summaryLine}</p>
    </div>
  );
}

function getNodeSummary(type: string, config: Record<string, unknown>): string | null {
  switch (type) {
    case 'agent':
      return `${config.model ?? 'No model'} · ${config.memory ? 'Memory on' : 'No memory'}`;
    case 'input':
      return String(config.description || config.label || '');
    case 'output':
      return String(config.label || '');
    case 'condition':
      return config.expression ? `If ${config.expression}` : 'No expression set';
    case 'router':
      return `${(config.routes as unknown[] ?? []).length} routes`;
    case 'tool':
      return String(config.toolName || 'No tool selected');
    case 'memory':
      return `${config.operation} · ${config.memoryType}`;
    case 'api_call':
      return config.url ? `${config.method} ${config.url}` : 'No URL configured';
    case 'prompt':
      return config.template ? 'Template configured' : 'No template set';
    case 'approval':
      return `${(config.approvers as string[] ?? []).length} approver(s) · ${config.timeoutHours}h timeout`;
    case 'loop':
      return `${config.loopType} · max ${config.maxIterations} iterations`;
    default:
      return null;
  }
}
