import { create } from 'zustand';
import type { NodeStatus } from '@/lib/executor';

interface NodeRunState {
  status: NodeStatus;
  output: string;
  error?: string;
}

interface RunStore {
  isOpen: boolean;
  isRunning: boolean;
  nodeStates: Record<string, NodeRunState>;
  userInputs: Record<string, string>;

  openPanel: () => void;
  closePanel: () => void;
  setUserInput: (nodeId: string, value: string) => void;
  resetRun: () => void;
  setNodeStatus: (nodeId: string, status: NodeStatus) => void;
  appendNodeChunk: (nodeId: string, text: string) => void;
  setNodeDone: (nodeId: string, output: string) => void;
  setNodeError: (nodeId: string, message: string) => void;
  setRunning: (v: boolean) => void;
}

export const useRunStore = create<RunStore>((set) => ({
  isOpen: false,
  isRunning: false,
  nodeStates: {},
  userInputs: {},

  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  setUserInput: (nodeId, value) =>
    set((s) => ({ userInputs: { ...s.userInputs, [nodeId]: value } })),

  resetRun: () => set({ nodeStates: {}, isRunning: false }),

  setNodeStatus: (nodeId, status) =>
    set((s) => ({
      nodeStates: {
        ...s.nodeStates,
        [nodeId]: { ...(s.nodeStates[nodeId] ?? { output: '' }), status },
      },
    })),

  appendNodeChunk: (nodeId, text) =>
    set((s) => {
      const prev = s.nodeStates[nodeId] ?? { status: 'running' as NodeStatus, output: '' };
      return {
        nodeStates: {
          ...s.nodeStates,
          [nodeId]: { ...prev, output: prev.output + text },
        },
      };
    }),

  setNodeDone: (nodeId, output) =>
    set((s) => ({
      nodeStates: {
        ...s.nodeStates,
        [nodeId]: { status: 'done', output },
      },
    })),

  setNodeError: (nodeId, message) =>
    set((s) => ({
      nodeStates: {
        ...s.nodeStates,
        [nodeId]: { status: 'error', output: s.nodeStates[nodeId]?.output ?? '', error: message },
      },
    })),

  setRunning: (v) => set({ isRunning: v }),
}));
