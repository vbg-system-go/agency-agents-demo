'use client';

import React from 'react';
import { MousePointerClick, ArrowDown } from 'lucide-react';

export function CanvasEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6 pointer-events-none select-none">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 shadow-sm">
          <MousePointerClick className="h-8 w-8 text-violet-500" />
        </div>
        <div className="max-w-xs">
          <h3 className="text-base font-semibold text-zinc-700 mb-1">
            Start building your workflow
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Drag blocks from the left panel onto the canvas, then connect them to create your AI workflow.
          </p>
        </div>
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <p className="text-xs text-zinc-400 font-medium">Or load an example</p>
          <ArrowDown className="h-4 w-4 text-zinc-300 animate-bounce" />
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-4">
        {[
          { key: 'Del', label: 'Delete selected' },
          { key: '⌘Z', label: 'Undo' },
          { key: '⌘D', label: 'Duplicate' },
          { key: 'Space', label: 'Pan' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5">
            <kbd className="rounded bg-white border border-zinc-200 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-500 shadow-sm">
              {key}
            </kbd>
            <span className="text-[11px] text-zinc-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
