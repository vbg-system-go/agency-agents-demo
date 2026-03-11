import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { EditorState } from '@/types';

interface EditorSlice extends EditorState {
  setSelectedNodes: (ids: string[]) => void;
  setSelectedEdges: (ids: string[]) => void;
  clearSelection: () => void;
  setClipboard: (data: EditorState['clipboard']) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setPanelOpen: (panel: EditorState['panelOpen']) => void;
  togglePanel: (panel: NonNullable<EditorState['panelOpen']>) => void;
  setZoom: (zoom: number) => void;
  toggleMiniMap: () => void;
  toggleGrid: () => void;
  toggleConnectionLabels: () => void;
  setValidationMode: (mode: EditorState['validationMode']) => void;
}

export const useEditorStore = create<EditorSlice>()(
  immer((set) => ({
    selectedNodeIds: [],
    selectedEdgeIds: [],
    clipboard: null,
    isDirty: false,
    isSaving: false,
    validationMode: 'passive',
    panelOpen: 'properties',
    zoom: 1,
    showMiniMap: true,
    showGrid: true,
    showConnectionLabels: true,

    setSelectedNodes: (ids) =>
      set((state) => {
        state.selectedNodeIds = ids;
      }),

    setSelectedEdges: (ids) =>
      set((state) => {
        state.selectedEdgeIds = ids;
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedNodeIds = [];
        state.selectedEdgeIds = [];
      }),

    setClipboard: (data) =>
      set((state) => {
        state.clipboard = data;
      }),

    setIsDirty: (dirty) =>
      set((state) => {
        state.isDirty = dirty;
      }),

    setIsSaving: (saving) =>
      set((state) => {
        state.isSaving = saving;
      }),

    setPanelOpen: (panel) =>
      set((state) => {
        state.panelOpen = panel;
      }),

    togglePanel: (panel) =>
      set((state) => {
        state.panelOpen = state.panelOpen === panel ? null : panel;
      }),

    setZoom: (zoom) =>
      set((state) => {
        state.zoom = zoom;
      }),

    toggleMiniMap: () =>
      set((state) => {
        state.showMiniMap = !state.showMiniMap;
      }),

    toggleGrid: () =>
      set((state) => {
        state.showGrid = !state.showGrid;
      }),

    toggleConnectionLabels: () =>
      set((state) => {
        state.showConnectionLabels = !state.showConnectionLabels;
      }),

    setValidationMode: (mode) =>
      set((state) => {
        state.validationMode = mode;
      }),
  }))
);
