'use client';

import React, { useState } from 'react';
import {
  Bot, LogIn, LogOut, GitBranch, Network, Wrench,
  Database, Globe, MessageSquare, UserCheck, RefreshCw,
  Square, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { NODE_TYPE_REGISTRY, NODE_CATEGORIES } from '@/types/node-registry';
import type { NodeTypeDefinition } from '@/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Bot, LogIn, LogOut, GitBranch, Network, Wrench,
  Database, Globe, MessageSquare, UserCheck, RefreshCw, Square,
};

const COLOR_MAP: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  blue: 'bg-blue-100 text-blue-600',
  amber: 'bg-amber-100 text-amber-600',
  orange: 'bg-orange-100 text-orange-600',
  cyan: 'bg-cyan-100 text-cyan-600',
  purple: 'bg-purple-100 text-purple-600',
  teal: 'bg-teal-100 text-teal-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  rose: 'bg-rose-100 text-rose-600',
  sky: 'bg-sky-100 text-sky-600',
  slate: 'bg-slate-100 text-slate-600',
};

function DraggableNodeItem({ def }: { def: NodeTypeDefinition }) {
  const Icon = ICON_MAP[def.icon] ?? Bot;
  const colorClass = COLOR_MAP[def.color] ?? 'bg-slate-100 text-slate-600';

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow-node-type', def.type);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg p-2.5 cursor-grab',
        'border border-transparent hover:border-zinc-200 hover:bg-white hover:shadow-sm',
        'active:cursor-grabbing active:scale-95 transition-all duration-150',
        'select-none'
      )}
      title={def.description}
    >
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', colorClass)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-800">{def.label}</p>
        <p className="text-[10px] text-zinc-400 truncate">{def.description}</p>
      </div>
    </div>
  );
}

export function NodePalette() {
  const [search, setSearch] = useState('');

  const allDefs = Object.values(NODE_TYPE_REGISTRY);

  const filteredDefs = search.trim()
    ? allDefs.filter(
        (d) =>
          d.label.toLowerCase().includes(search.toLowerCase()) ||
          d.description.toLowerCase().includes(search.toLowerCase())
      )
    : allDefs;

  const categorized = Object.entries(NODE_CATEGORIES)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([categoryKey, meta]) => ({
      key: categoryKey,
      label: meta.label,
      defs: filteredDefs.filter((d) => d.category === categoryKey),
    }))
    .filter((c) => c.defs.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-100">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Blocks
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search blocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
          />
        </div>
      </div>

      {/* Drag hint */}
      <div className="px-4 py-2 bg-violet-50/60 border-b border-violet-100/60">
        <p className="text-[10px] text-violet-600 font-medium">
          Drag blocks onto the canvas
        </p>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {categorized.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Search className="h-8 w-8 text-zinc-300 mb-2" />
            <p className="text-sm text-zinc-400">No blocks match &quot;{search}&quot;</p>
          </div>
        ) : (
          categorized.map(({ key, label, defs }) => (
            <div key={key}>
              <p className="px-2 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                {label}
              </p>
              <div className="space-y-0.5">
                {defs.map((def) => (
                  <DraggableNodeItem key={def.type} def={def} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
