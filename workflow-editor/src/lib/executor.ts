// This file is server-only — only imported by /api/run/route.ts
import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { Workflow, WorkflowNode, WorkflowEdge, LLMProvider } from '@/types';

export type NodeStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped';

export interface ExecutionEvent {
  type: 'node_start' | 'node_chunk' | 'node_done' | 'node_error' | 'workflow_done' | 'workflow_error';
  nodeId?: string;
  text?: string;
  output?: string;
  outputs?: Record<string, string>;
  message?: string;
}

// ─── Graph helpers ─────────────────────────────────────────────────────────────

function buildGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};
  const predecessors: Record<string, string[]> = {};

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

function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const { inDegree, adjList } = buildGraph(nodes, edges);
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const degrees = { ...inDegree };

  const queue: string[] = [];
  for (const [id, deg] of Object.entries(degrees)) {
    if (deg === 0) queue.push(id);
  }
  // Input nodes first
  queue.sort((a, b) => {
    const ta = nodeMap[a]?.data.nodeType;
    const tb = nodeMap[b]?.data.nodeType;
    if (ta === 'input' && tb !== 'input') return -1;
    if (tb === 'input' && ta !== 'input') return 1;
    return 0;
  });

  const result: WorkflowNode[] = [];
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

// ─── Provider factory ──────────────────────────────────────────────────────────

function getModel(provider: LLMProvider, modelId: string) {
  if (provider === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY ?? '';
    if (!key) throw new Error('Anthropic API key not configured. Set ANTHROPIC_API_KEY on the server.');
    return createAnthropic({ apiKey: key })(modelId);
  }

  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY ?? '';
    if (!key) throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY on the server.');
    return createOpenAI({ apiKey: key })(modelId);
  }

  throw new Error(`Unknown provider: ${provider}`);
}

// ─── Main executor ─────────────────────────────────────────────────────────────

export async function* executeWorkflow(
  workflow: Workflow,
  userInputs: Record<string, string>
): AsyncGenerator<ExecutionEvent> {
  const { nodes, edges } = workflow;

  if (nodes.length === 0) {
    yield { type: 'workflow_error', message: 'Workflow has no nodes.' };
    return;
  }

  const order = topologicalSort(nodes, edges);
  const { predecessors } = buildGraph(nodes, edges);
  const nodeOutputs: Record<string, string> = {};

  // Seed input node outputs
  for (const node of nodes) {
    if (node.data.nodeType === 'input') {
      nodeOutputs[node.id] = userInputs[node.id] ?? '';
    }
  }

  for (const node of order) {
    const { nodeType, config } = node.data;

    const upstreamText = predecessors[node.id]
      .map((pid) => nodeOutputs[pid] ?? '')
      .filter(Boolean)
      .join('\n\n');

    if (nodeType === 'input') {
      yield { type: 'node_start', nodeId: node.id };
      yield { type: 'node_done', nodeId: node.id, output: nodeOutputs[node.id] };
      continue;
    }

    if (nodeType === 'output') {
      yield { type: 'node_start', nodeId: node.id };
      const out = upstreamText || '(no input)';
      nodeOutputs[node.id] = out;
      yield { type: 'node_done', nodeId: node.id, output: out };
      continue;
    }

    if (nodeType === 'agent') {
      yield { type: 'node_start', nodeId: node.id };

      const agentCfg = config as {
        provider?: LLMProvider;
        model?: string;
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
      };

      const provider: LLMProvider = agentCfg.provider ?? 'anthropic';
      const modelId = agentCfg.model ?? (provider === 'anthropic' ? 'claude-sonnet-4-6' : 'gpt-4o-mini');
      const systemPrompt = agentCfg.systemPrompt ?? 'You are a helpful assistant.';
      const userMessage = upstreamText || 'Begin.';

      let fullOutput = '';

      try {
        const model = getModel(provider, modelId);

        const result = streamText({
          model,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
          temperature: agentCfg.temperature ?? 0.7,
          maxOutputTokens: agentCfg.maxTokens ?? 4096,
        });

        for await (const chunk of result.textStream) {
          fullOutput += chunk;
          yield { type: 'node_chunk', nodeId: node.id, text: chunk };
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

    // Pass-through for all other node types
    yield { type: 'node_start', nodeId: node.id };
    const out = upstreamText || '';
    nodeOutputs[node.id] = out;
    yield { type: 'node_done', nodeId: node.id, output: out };
  }

  yield { type: 'workflow_done', outputs: nodeOutputs };
}
