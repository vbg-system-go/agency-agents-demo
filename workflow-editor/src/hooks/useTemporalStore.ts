import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useWorkflowStore } from '@/store/workflowStore';

export function useUndoRedo() {
  const canUndo = useStoreWithEqualityFn(
    useWorkflowStore.temporal,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => (state.pastStates?.length ?? 0) > 0,
    (a, b) => a === b
  );
  const canRedo = useStoreWithEqualityFn(
    useWorkflowStore.temporal,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => (state.futureStates?.length ?? 0) > 0,
    (a, b) => a === b
  );

  const undo = () => useWorkflowStore.temporal.getState().undo();
  const redo = () => useWorkflowStore.temporal.getState().redo();

  return { undo, redo, canUndo, canRedo };
}
