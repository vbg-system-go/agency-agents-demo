import Anthropic from '@anthropic-ai/sdk';
import type { Workflow, WorkflowNode, WorkflowEdge } from '@/types';

export type NodeStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped';

export interface ExecutionEvent {
  type: 'node_start' | 'node_chunk' | 'node_done' | 'node_error' | 'workflow_done' | 'workflow_error';
  nodeId?: string;
  text?: string;      // for node_chunk
  output?: string;    // for node_done
  outputs?: Record<string, string>; // for workflow_done
  message?: string;   // for errors
}

// Build adjacency list and compute in-degree for topological sort
function buildGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};   // nodeId -> downstream nodeIds
  const predecessors: Record<string, string[]> = {}; // nodeId -> upstream nodeIds

  for (const node of nodes) {
    inDegree[node.id] = 0;
    adjList[node.id] = [];
    predecessors[node.id] = [];
  }

  for (const edge of edges) {
    adjList[edge.source].push(edge.target);
    predecessors[edge.target].push(edge.source);
    inDegree[edge.target]++;
  }

  return { inDegree, adjList, predecessors };
}

// Kahn's algorithm — returns nodes in execution order
function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const { inDegree, adjList } = buildGraph(nodes, edges);
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const queue: string[] = [];
  for (const [id, deg] of Object.entries(inDegree)) {
    if (deg === 0) queue.push(id);
  }

  // Prioritize input nodes first
  queue.sort((a, b) => {
    const ta = nodeMap[a]?.data.nodeType;
    const tb = nodeMap[b]?.data.nodeType;
    if (ta === 'input' && tb !== 'input') return -1;
    if (tb === 'input' && ta !== 'input') return 1;
    return 0;
  });

  const result: WorkflowNode[] = [];
  const degrees = { ...inDegree };

  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap[id];
    if (node) result.push(node);

    for (const next of adjList[id]) {
      degrees[next]--;
      if (degrees[next] === 0) queue.push(next);
    }
  }

  return result;
}

export async function* executeWorkflow(
  workflow: Workflow,
  userInputs: Record<string, string>,
  apiKey: string
): AsyncGenerator<ExecutionEvent> {
  const client = new Anthropic({ apiKey });
  const { nodes, edges } = workflow;

  if (nodes.length === 0) {
    yield { type: 'workflow_error', message: 'Workflow has no nodes.' };
    return;
  }

  const order = topologicalSort(nodes, edges);
  const { predecessors } = buildGraph(nodes, edges);

  // nodeId → text output produced by that node
  const nodeOutputs: Record<string, string> = {};

  // Pre-fill input node outputs from userInputs
  for (const node of nodes) {
    if (node.data.nodeType === 'input') {
      nodeOutputs[node.id] = userInputs[node.id] ?? '';
    }
  }

  const finalOutputs: Record<string, string> = {};

  for (const node of order) {
    const { nodeType, config, label } = node.data;

    // Gather text from all upstream nodes
    const upstreamText = predecessors[node.id]
      .map((pid) => nodeOutputs[pid] ?? '')
      .filter(Boolean)
      .join('\n\n');

    if (nodeType === 'input') {
      // Already set above — just emit done
      yield { type: 'node_start', nodeId: node.id };
      yield { type: 'node_done', nodeId: node.id, output: nodeOutputs[node.id] };
      continue;
    }

    if (nodeType === 'output') {
      yield { type: 'node_start', nodeId: node.id };
      const out = upstreamText || '(no input)';
      nodeOutputs[node.id] = out;
      finalOutputs[node.id] = out;
      yield { type: 'node_done', nodeId: node.id, output: out };
      continue;
    }

    if (nodeType === 'agent') {
      yield { type: 'node_start', nodeId: node.id };

      const agentConfig = config as { systemPrompt?: string; model?: string; temperature?: number; maxTokens?: number };
      const systemPrompt = agentConfig.systemPrompt ?? 'You are a helpful assistant.';
      const model = agentConfig.model ?? 'claude-sonnet-4-6';
      const userMessage = upstreamText || 'Begin.';

      let fullOutput = '';

      try {
        const stream = client.messages.stream({
          model,
          max_tokens: agentConfig.maxTokens ?? 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        });

        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const text = chunk.delta.text;
            fullOutput += text;
            yield { type: 'node_chunk', nodeId: node.id, text };
          }
        }

        nodeOutputs[node.id] = fullOutput;
        yield { type: 'node_done', nodeId: node.id, output: fullOutput };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        yield { type: 'node_error', nodeId: node.id, message: msg };
        nodeOutputs[node.id] = `[Error: ${msg}]`;
      }
      continue;
    }

    // All other node types — pass through
    yield { type: 'node_start', nodeId: node.id };
    const out = upstreamText || '';
    nodeOutputs[node.id] = out;
    yield { type: 'node_done', nodeId: node.id, output: out };
  }

  yield { type: 'workflow_done', outputs: finalOutputs };
}
