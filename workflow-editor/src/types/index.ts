// ─── Core Domain Types ────────────────────────────────────────────────────────

export type NodeType =
  | 'agent'
  | 'input'
  | 'output'
  | 'condition'
  | 'router'
  | 'tool'
  | 'memory'
  | 'api_call'
  | 'prompt'
  | 'approval'
  | 'loop'
  | 'group';

export type HandleType = 'source' | 'target';
export type HandlePosition = 'top' | 'bottom' | 'left' | 'right';

export interface NodeHandle {
  id: string;
  type: HandleType;
  position: HandlePosition;
  label?: string;
  dataType?: string;
}

// ─── Node Config Variants ─────────────────────────────────────────────────────

export type LLMProvider = 'anthropic' | 'openai';

export interface AgentConfig {
  provider: LLMProvider;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
  memory: boolean;
}

export interface InputConfig {
  label: string;
  description: string;
  inputType: 'text' | 'json' | 'file' | 'number';
  required: boolean;
  defaultValue: string;
  schema?: string;
}

export interface OutputConfig {
  label: string;
  outputType: 'text' | 'json' | 'stream';
  format: string;
}

export interface ConditionConfig {
  expression: string;
  trueLabel: string;
  falseLabel: string;
  language: 'jinja2' | 'javascript' | 'python';
}

export interface RouterConfig {
  routes: RouterRoute[];
  defaultRoute?: string;
}

export interface RouterRoute {
  id: string;
  label: string;
  condition: string;
}

export interface ToolConfig {
  toolName: string;
  toolType: 'builtin' | 'custom' | 'mcp';
  description: string;
  parameters: Record<string, unknown>;
  returnSchema?: string;
}

export interface MemoryConfig {
  memoryType: 'short_term' | 'long_term' | 'vector' | 'graph';
  operation: 'read' | 'write' | 'search' | 'clear';
  namespace: string;
  ttl?: number;
}

export interface ApiCallConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  bodyTemplate: string;
  authType: 'none' | 'bearer' | 'api_key' | 'basic';
  authValue: string;
  timeoutMs: number;
}

export interface PromptConfig {
  template: string;
  language: 'jinja2' | 'f-string' | 'mustache';
  outputVariable: string;
}

export interface ApprovalConfig {
  message: string;
  approvers: string[];
  timeoutHours: number;
  onTimeout: 'reject' | 'approve' | 'escalate';
}

export interface LoopConfig {
  loopType: 'for_each' | 'while' | 'fixed';
  iterableVar: string;
  condition: string;
  maxIterations: number;
  itemVar: string;
}

export interface GroupConfig {
  label: string;
  color: string;
  collapsed: boolean;
  nodeIds: string[];
}

export type NodeConfig =
  | AgentConfig
  | InputConfig
  | OutputConfig
  | ConditionConfig
  | RouterConfig
  | ToolConfig
  | MemoryConfig
  | ApiCallConfig
  | PromptConfig
  | ApprovalConfig
  | LoopConfig
  | GroupConfig;

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationError {
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
}

// ─── Core Node ────────────────────────────────────────────────────────────────

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: NodeType;
  config: Partial<NodeConfig>;
  notes?: string;
  validation?: ValidationState;
  groupId?: string;
}

// ReactFlow compatible node
export interface WorkflowNode {
  id: string;
  type: string; // matches ReactFlow's type field
  position: { x: number; y: number };
  data: WorkflowNodeData;
  selected?: boolean;
  dragging?: boolean;
  width?: number;
  height?: number;
  parentId?: string;
  extent?: 'parent' | [[number, number], [number, number]];
  style?: React.CSSProperties;
  className?: string;
}

// ─── Edge ─────────────────────────────────────────────────────────────────────

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  animated?: boolean;
  label?: string;
  style?: React.CSSProperties;
  data?: {
    label?: string;
    condition?: string;
  };
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

export interface WorkflowMeta {
  id: string;
  name: string;
  description: string;
  tags: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
  authorId?: string;
  isTemplate?: boolean;
}

export interface Workflow extends WorkflowMeta {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

// ─── Template ─────────────────────────────────────────────────────────────────

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  preview?: string; // URL or base64 image
  workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>;
}

// ─── Node Type Registry ───────────────────────────────────────────────────────

export interface NodeTypeDefinition {
  type: NodeType;
  label: string;
  description: string;
  category: NodeCategory;
  icon: string; // lucide icon name
  color: string; // tailwind color class stem
  defaultConfig: Partial<NodeConfig>;
  handles: NodeHandle[];
  canHaveChildren?: boolean; // for group nodes
  minConnections?: number;
  maxConnections?: number;
}

export type NodeCategory =
  | 'io'
  | 'ai'
  | 'logic'
  | 'integration'
  | 'memory'
  | 'control';

// ─── Editor UI State ──────────────────────────────────────────────────────────

export interface EditorState {
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  clipboard: { nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null;
  isDirty: boolean;
  isSaving: boolean;
  validationMode: 'off' | 'passive' | 'strict';
  panelOpen: 'properties' | 'templates' | 'history' | null;
  zoom: number;
  showMiniMap: boolean;
  showGrid: boolean;
  showConnectionLabels: boolean;
}

// ─── History ──────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  timestamp: string;
  label: string;
  snapshot: { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
}
