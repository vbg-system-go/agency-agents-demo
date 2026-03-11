'use client';

import React from 'react';
import { NodeResizer, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils/cn';
import type { WorkflowNodeData } from '@/types';
import type { GroupConfig } from '@/types';

interface GroupNodeProps extends NodeProps {
  data: WorkflowNodeData;
}

export function GroupNode({ data, selected }: GroupNodeProps) {
  const config = data.config as GroupConfig;

  return (
    <>
      <NodeResizer
        color="#6d28d9"
        isVisible={selected}
        minWidth={200}
        minHeight={150}
        lineStyle={{ strokeWidth: 1 }}
        handleStyle={{ width: 8, height: 8, borderRadius: 4 }}
      />
      <div
        className={cn(
          'w-full h-full rounded-xl border-2 border-dashed transition-all duration-150',
          selected ? 'border-violet-400 bg-violet-50/30' : 'border-zinc-300 bg-zinc-50/20'
        )}
      >
        <div className="absolute top-2 left-3">
          <span className="text-xs font-semibold text-zinc-500">{config?.label ?? data.label}</span>
        </div>
      </div>
    </>
  );
}
