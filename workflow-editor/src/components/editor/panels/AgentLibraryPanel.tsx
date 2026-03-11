'use client';

import React, { useEffect, useState } from 'react';
import { Search, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { AgentMeta, Division } from '@/app/api/agents/route';

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
  pink: 'bg-pink-100 text-pink-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-600',
};

function AgentItem({ agent }: { agent: AgentMeta }) {
  const colorClass = COLOR_MAP[agent.color] ?? 'bg-violet-100 text-violet-600';

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData(
      'application/reactflow-agent',
      JSON.stringify({
        name: agent.name,
        emoji: agent.emoji,
        systemPrompt: agent.systemPrompt,
      })
    );
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
      title={agent.description || agent.vibe}
    >
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm', colorClass)}>
        {agent.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-800 truncate">{agent.name}</p>
        <p className="text-[10px] text-zinc-400 truncate">{agent.description || agent.vibe}</p>
      </div>
    </div>
  );
}

function DivisionSection({ division, defaultOpen }: { division: Division; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-zinc-50 rounded-md transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-zinc-400 shrink-0" />
        )}
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
          {division.emoji} {division.label}
        </span>
        <span className="ml-auto text-[10px] text-zinc-300 font-medium">{division.agents.length}</span>
      </button>
      {open && (
        <div className="space-y-0.5">
          {division.agents.map((agent) => (
            <AgentItem key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AgentLibraryPanel() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => {
        setDivisions(data.divisions ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load agents');
        setLoading(false);
      });
  }, []);

  const query = search.trim().toLowerCase();

  const filteredDivisions = query
    ? divisions
        .map((div) => ({
          ...div,
          agents: div.agents.filter(
            (a) =>
              a.name.toLowerCase().includes(query) ||
              a.description.toLowerCase().includes(query) ||
              a.vibe.toLowerCase().includes(query)
          ),
        }))
        .filter((div) => div.agents.length > 0)
    : divisions;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
          />
        </div>
      </div>

      {/* Drag hint */}
      <div className="px-4 py-2 bg-violet-50/60 border-b border-violet-100/60">
        <p className="text-[10px] text-violet-600 font-medium">
          Drag agents onto the canvas
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-zinc-300 animate-spin mb-2" />
            <p className="text-xs text-zinc-400">Loading agents…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && filteredDivisions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Search className="h-8 w-8 text-zinc-300 mb-2" />
            <p className="text-sm text-zinc-400">No agents match &quot;{search}&quot;</p>
          </div>
        )}

        {!loading &&
          !error &&
          filteredDivisions.map((div, i) => (
            <DivisionSection key={div.id} division={div} defaultOpen={i === 0} />
          ))}
      </div>
    </div>
  );
}
