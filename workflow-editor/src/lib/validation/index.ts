import type { Workflow, WorkflowNode, WorkflowEdge } from '@/types';
import { NODE_TYPE_REGISTRY } from '@/types/node-registry';

export interface WorkflowValidationError {
  nodeId?: string;
  edgeId?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export function validateWorkflow(workflow: Workflow): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];

  // Must have at least one input node
  const inputNodes = workflow.nodes.filter((n) => n.type === 'input');
  if (inputNodes.length === 0 && workflow.nodes.length > 0) {
    errors.push({
      message: 'Workflow has no Input node',
      severity: 'warning',
    });
  }

  // Must have at least one output node
  const outputNodes = workflow.nodes.filter((n) => n.type === 'output');
  if (outputNodes.length === 0 && workflow.nodes.length > 0) {
    errors.push({
      message: 'Workflow has no Output node',
      severity: 'warning',
    });
  }

  workflow.nodes.forEach((node) => {
    errors.push(...validateNode(node, workflow));
  });

  workflow.edges.forEach((edge) => {
    errors.push(...validateEdge(edge, workflow));
  });

  // Check for disconnected nodes
  const connectedNodeIds = new Set<string>();
  workflow.edges.forEach((e) => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  workflow.nodes
    .filter((n) => n.type !== 'group')
    .forEach((node) => {
      if (!connectedNodeIds.has(node.id) && workflow.nodes.length > 1) {
        errors.push({
          nodeId: node.id,
          message: 'Node is not connected to anything',
          severity: 'warning',
        });
      }
    });

  return errors;
}

function validateNode(node: WorkflowNode, workflow: Workflow): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];
  const def = NODE_TYPE_REGISTRY[node.type];
  if (!def) return errors;

  const config = node.data.config as Record<string, unknown>;

  switch (node.type) {
    case 'agent': {
      if (!config.model) {
        errors.push({ nodeId: node.id, field: 'model', message: 'Agent model is required', severity: 'error' });
      }
      break;
    }
    case 'input': {
      if (!config.label) {
        errors.push({ nodeId: node.id, field: 'label', message: 'Input label is required', severity: 'error' });
      }
      break;
    }
    case 'output': {
      if (!config.label) {
        errors.push({ nodeId: node.id, field: 'label', message: 'Output label is required', severity: 'error' });
      }
      break;
    }
    case 'condition': {
      if (!config.expression) {
        errors.push({ nodeId: node.id, field: 'expression', message: 'Condition expression is required', severity: 'error' });
      }
      // Condition must have both outgoing edges (true/false)
      const outEdges = workflow.edges.filter((e) => e.source === node.id);
      const hasTrue = outEdges.some((e) => e.sourceHandle === 'true');
      const hasFalse = outEdges.some((e) => e.sourceHandle === 'false');
      if (!hasTrue) errors.push({ nodeId: node.id, message: 'Missing True branch connection', severity: 'warning' });
      if (!hasFalse) errors.push({ nodeId: node.id, message: 'Missing False branch connection', severity: 'warning' });
      break;
    }
    case 'api_call': {
      if (!config.url) {
        errors.push({ nodeId: node.id, field: 'url', message: 'API URL is required', severity: 'error' });
      }
      break;
    }
    case 'tool': {
      if (!config.toolName) {
        errors.push({ nodeId: node.id, field: 'toolName', message: 'Tool name is required', severity: 'error' });
      }
      break;
    }
    case 'loop': {
      const loopConfig = config as { loopType?: string; iterableVar?: string; maxIterations?: number };
      if (loopConfig.loopType === 'for_each' && !loopConfig.iterableVar) {
        errors.push({ nodeId: node.id, field: 'iterableVar', message: 'Iterable variable is required', severity: 'error' });
      }
      if ((loopConfig.maxIterations ?? 0) <= 0) {
        errors.push({ nodeId: node.id, field: 'maxIterations', message: 'Max iterations must be greater than 0', severity: 'error' });
      }
      break;
    }
    case 'router': {
      const routerConfig = config as { routes?: Array<{ id: string; label: string; condition: string }> };
      if (!routerConfig.routes || routerConfig.routes.length === 0) {
        errors.push({ nodeId: node.id, message: 'Router must have at least one route', severity: 'error' });
      }
      break;
    }
  }

  // Check minimum incoming connections
  if (def.type !== 'input' && def.type !== 'group') {
    const targetDef = def.handles.find((h) => h.type === 'target');
    if (targetDef) {
      const inEdges = workflow.edges.filter((e) => e.target === node.id);
      if (inEdges.length === 0) {
        errors.push({
          nodeId: node.id,
          message: 'Node has no incoming connections',
          severity: 'warning',
        });
      }
    }
  }

  return errors;
}

function validateEdge(edge: WorkflowEdge, workflow: Workflow): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];

  const sourceNode = workflow.nodes.find((n) => n.id === edge.source);
  const targetNode = workflow.nodes.find((n) => n.id === edge.target);

  if (!sourceNode) {
    errors.push({ edgeId: edge.id, message: 'Edge references a missing source node', severity: 'error' });
  }
  if (!targetNode) {
    errors.push({ edgeId: edge.id, message: 'Edge references a missing target node', severity: 'error' });
  }

  // Prevent self-loops
  if (edge.source === edge.target) {
    errors.push({ edgeId: edge.id, message: 'Self-connections are not allowed', severity: 'error' });
  }

  return errors;
}

export function isWorkflowValid(workflow: Workflow): boolean {
  return validateWorkflow(workflow).filter((e) => e.severity === 'error').length === 0;
}
