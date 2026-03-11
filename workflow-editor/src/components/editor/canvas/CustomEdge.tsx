'use client';

import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { cn } from '@/lib/utils/cn';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  animated,
  label,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? '#6d28d9' : '#a1a1aa',
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: animated ? '8 4' : undefined,
        }}
        className={cn(
          'transition-all duration-150',
          animated && 'react-flow__edge-path--animated'
        )}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <span className="rounded-full bg-white border border-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-600 shadow-sm">
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
