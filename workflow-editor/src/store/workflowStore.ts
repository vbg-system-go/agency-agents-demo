import { create } from 'zustand';
import { temporal } from 'zundo';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { WorkflowNode, WorkflowEdge, Workflow, WorkflowMeta } from '@/types';
import { NODE_TYPE_REGISTRY } from '@/types/node-registry';
import { validateWorkflow } from '@/lib/validation';
import { saveWorkflow, loadWorkflow, listWorkflows } from '@/lib/persistence';

interface WorkflowSlice {
  // Current workflow state
  workflow: Workflow;
  savedWorkflows: WorkflowMeta[];

  // Node operations
  addNode: (type: string, position: { x: number; y: number }, overrides?: Partial<WorkflowNode['data']>) => WorkflowNode;
  updateNode: (id: string, data: Partial<WorkflowNode['data']>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  deleteNodes: (ids: string[]) => void;
  duplicateNodes: (ids: string[]) => WorkflowNode[];
  setNodes: (nodes: WorkflowNode[]) => void;

  // Edge operations
  addEdge: (edge: Omit<WorkflowEdge, 'id'>) => WorkflowEdge;
  updateEdge: (id: string, data: Partial<WorkflowEdge>) => void;
  deleteEdges: (ids: string[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;

  // Workflow operations
  setWorkflow: (workflow: Workflow) => void;
  updateWorkflowMeta: (meta: Partial<WorkflowMeta>) => void;
  newWorkflow: () => void;
  saveCurrentWorkflow: () => Promise<void>;
  loadWorkflowById: (id: string) => Promise<void>;
  loadSavedWorkflows: () => void;

  // Group operations
  groupNodes: (ids: string[]) => string;
  ungroupNodes: (groupId: string) => void;

  // Validation
  runValidation: () => void;

  // Viewport
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
}

const createDefaultWorkflow = (): Workflow => ({
  id: nanoid(),
  name: 'Untitled Workflow',
  description: '',
  tags: [],
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
});

export const useWorkflowStore = create<WorkflowSlice>()(
  temporal(
    immer((set, get) => ({
      workflow: createDefaultWorkflow(),
      savedWorkflows: [],

      addNode: (type, position, overrides) => {
        const def = NODE_TYPE_REGISTRY[type];
        if (!def) throw new Error(`Unknown node type: ${type}`);

        const node: WorkflowNode = {
          id: nanoid(),
          type,
          position,
          data: {
            label: def.label,
            nodeType: def.type,
            ...overrides,
            config: { ...def.defaultConfig, ...(overrides?.config ?? {}) },
          },
        };

        set((state) => {
          state.workflow.nodes.push(node);
          state.workflow.updatedAt = new Date().toISOString();
        });

        return node;
      },

      updateNode: (id, data) => {
        set((state) => {
          const node = state.workflow.nodes.find((n) => n.id === id);
          if (node) {
            node.data = { ...node.data, ...data };
            if (data.config) {
              node.data.config = { ...node.data.config, ...data.config };
            }
            state.workflow.updatedAt = new Date().toISOString();
          }
        });
      },

      updateNodePosition: (id, position) => {
        set((state) => {
          const node = state.workflow.nodes.find((n) => n.id === id);
          if (node) node.position = position;
        });
      },

      deleteNodes: (ids) => {
        set((state) => {
          state.workflow.nodes = state.workflow.nodes.filter(
            (n) => !ids.includes(n.id)
          );
          // Remove edges connected to deleted nodes
          state.workflow.edges = state.workflow.edges.filter(
            (e) => !ids.includes(e.source) && !ids.includes(e.target)
          );
          state.workflow.updatedAt = new Date().toISOString();
        });
      },

      duplicateNodes: (ids) => {
        const { workflow } = get();
        const toDuplicate = workflow.nodes.filter((n) => ids.includes(n.id));
        const idMap = new Map<string, string>();

        const newNodes = toDuplicate.map((node) => {
          const newId = nanoid();
          idMap.set(node.id, newId);
          return {
            ...node,
            id: newId,
            position: { x: node.position.x + 40, y: node.position.y + 40 },
            selected: true,
          };
        });

        // Duplicate edges between duplicated nodes
        const newEdges = workflow.edges
          .filter(
            (e) =>
              idMap.has(e.source) && idMap.has(e.target)
          )
          .map((e) => ({
            ...e,
            id: nanoid(),
            source: idMap.get(e.source)!,
            target: idMap.get(e.target)!,
          }));

        set((state) => {
          state.workflow.nodes.push(...newNodes);
          state.workflow.edges.push(...newEdges);
          state.workflow.updatedAt = new Date().toISOString();
        });

        return newNodes;
      },

      setNodes: (nodes) => {
        set((state) => {
          state.workflow.nodes = nodes;
        });
      },

      addEdge: (edge) => {
        const newEdge: WorkflowEdge = { ...edge, id: nanoid() };
        set((state) => {
          // Prevent duplicate edges between same source/target handles
          const exists = state.workflow.edges.some(
            (e) =>
              e.source === edge.source &&
              e.target === edge.target &&
              e.sourceHandle === edge.sourceHandle &&
              e.targetHandle === edge.targetHandle
          );
          if (!exists) {
            state.workflow.edges.push(newEdge);
            state.workflow.updatedAt = new Date().toISOString();
          }
        });
        return newEdge;
      },

      updateEdge: (id, data) => {
        set((state) => {
          const edge = state.workflow.edges.find((e) => e.id === id);
          if (edge) Object.assign(edge, data);
        });
      },

      deleteEdges: (ids) => {
        set((state) => {
          state.workflow.edges = state.workflow.edges.filter(
            (e) => !ids.includes(e.id)
          );
        });
      },

      setEdges: (edges) => {
        set((state) => {
          state.workflow.edges = edges;
        });
      },

      setWorkflow: (workflow) => {
        set((state) => {
          state.workflow = workflow;
        });
      },

      updateWorkflowMeta: (meta) => {
        set((state) => {
          Object.assign(state.workflow, meta);
          state.workflow.updatedAt = new Date().toISOString();
        });
      },

      newWorkflow: () => {
        set((state) => {
          state.workflow = createDefaultWorkflow();
        });
      },

      saveCurrentWorkflow: async () => {
        const { workflow } = get();
        const updated = {
          ...workflow,
          updatedAt: new Date().toISOString(),
        };
        saveWorkflow(updated);
        set((state) => {
          state.workflow = updated;
        });
        get().loadSavedWorkflows();
      },

      loadWorkflowById: async (id) => {
        const workflow = loadWorkflow(id);
        if (workflow) {
          set((state) => {
            state.workflow = workflow;
          });
        }
      },

      loadSavedWorkflows: () => {
        const workflows = listWorkflows();
        set((state) => {
          state.savedWorkflows = workflows;
        });
      },

      groupNodes: (ids) => {
        const groupId = nanoid();
        set((state) => {
          const groupNode: WorkflowNode = {
            id: groupId,
            type: 'group',
            position: { x: 0, y: 0 },
            data: {
              label: 'Group',
              nodeType: 'group',
              config: {
                label: 'Group',
                color: '#94a3b8',
                collapsed: false,
                nodeIds: ids,
              },
            },
            style: { width: 400, height: 300 },
          };

          // Calculate bounding box
          const nodes = state.workflow.nodes.filter((n) => ids.includes(n.id));
          if (nodes.length > 0) {
            const minX = Math.min(...nodes.map((n) => n.position.x)) - 20;
            const minY = Math.min(...nodes.map((n) => n.position.y)) - 40;
            const maxX = Math.max(...nodes.map((n) => n.position.x + (n.width ?? 200))) + 20;
            const maxY = Math.max(...nodes.map((n) => n.position.y + (n.height ?? 80))) + 20;

            groupNode.position = { x: minX, y: minY };
            groupNode.style = {
              width: maxX - minX,
              height: maxY - minY,
            };

            // Update child nodes to be relative to group
            nodes.forEach((node) => {
              node.parentId = groupId;
              node.extent = 'parent';
              node.position = {
                x: node.position.x - minX,
                y: node.position.y - minY,
              };
            });
          }

          state.workflow.nodes.unshift(groupNode);
        });
        return groupId;
      },

      ungroupNodes: (groupId) => {
        set((state) => {
          const groupNode = state.workflow.nodes.find((n) => n.id === groupId);
          if (!groupNode) return;

          // Move child nodes back to absolute positions
          state.workflow.nodes.forEach((node) => {
            if (node.parentId === groupId) {
              node.position = {
                x: node.position.x + groupNode.position.x,
                y: node.position.y + groupNode.position.y,
              };
              delete node.parentId;
              delete node.extent;
            }
          });

          state.workflow.nodes = state.workflow.nodes.filter(
            (n) => n.id !== groupId
          );
        });
      },

      runValidation: () => {
        const { workflow } = get();
        const errors = validateWorkflow(workflow);

        set((state) => {
          state.workflow.nodes.forEach((node) => {
            const nodeErrors = errors.filter((e) => e.nodeId === node.id);
            node.data.validation = {
              isValid: nodeErrors.length === 0,
              errors: nodeErrors.map((e) => ({
                field: e.field,
                message: e.message,
                severity: e.severity,
              })),
            };
          });
        });
      },

      setViewport: (viewport) => {
        set((state) => {
          state.workflow.viewport = viewport;
        });
      },
    })),
    {
      limit: 50,
      partialize: (state) => ({
        workflow: { nodes: state.workflow.nodes, edges: state.workflow.edges },
      }),
    }
  )
);
