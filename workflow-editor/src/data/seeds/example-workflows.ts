import type { Workflow } from '@/types';

export const EXAMPLE_WORKFLOW: Workflow = {
  id: 'example-customer-support',
  name: 'Customer Support Agent',
  description: 'A multi-step workflow that handles customer inquiries with routing and human approval',
  tags: ['support', 'agent', 'example'],
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  viewport: { x: 50, y: 50, zoom: 0.85 },
  nodes: [
    {
      id: 'n1',
      type: 'input',
      position: { x: 300, y: 60 },
      data: {
        label: 'Customer Message',
        nodeType: 'input',
        config: {
          label: 'Customer Message',
          description: 'Incoming customer inquiry',
          inputType: 'text',
          required: true,
          defaultValue: '',
        },
      },
    },
    {
      id: 'n2',
      type: 'prompt',
      position: { x: 300, y: 200 },
      data: {
        label: 'Format Context',
        nodeType: 'prompt',
        config: {
          template: 'Customer inquiry: {{ input }}\n\nPlease classify and respond to this inquiry.',
          language: 'jinja2',
          outputVariable: 'formatted_prompt',
        },
      },
    },
    {
      id: 'n3',
      type: 'agent',
      position: { x: 300, y: 360 },
      data: {
        label: 'Support Agent',
        nodeType: 'agent',
        config: {
          model: 'claude-opus-4-6',
          systemPrompt: 'You are a helpful customer support agent. Classify the inquiry as: billing, technical, or general. Then provide a helpful response.',
          temperature: 0.3,
          maxTokens: 1024,
          tools: [],
          memory: true,
        },
      },
    },
    {
      id: 'n4',
      type: 'condition',
      position: { x: 300, y: 520 },
      data: {
        label: 'Needs Escalation?',
        nodeType: 'condition',
        config: {
          expression: "{{ response.confidence < 0.7 or response.category == 'billing' }}",
          trueLabel: 'Escalate',
          falseLabel: 'Auto-respond',
          language: 'jinja2',
        },
      },
    },
    {
      id: 'n5',
      type: 'approval',
      position: { x: 100, y: 680 },
      data: {
        label: 'Human Review',
        nodeType: 'approval',
        config: {
          message: 'Please review this customer inquiry and approve the automated response, or provide an override.',
          approvers: ['support-lead@company.com'],
          timeoutHours: 4,
          onTimeout: 'escalate',
        },
      },
    },
    {
      id: 'n6',
      type: 'output',
      position: { x: 500, y: 680 },
      data: {
        label: 'Send Response',
        nodeType: 'output',
        config: {
          label: 'Customer Response',
          outputType: 'text',
          format: '',
        },
      },
    },
    {
      id: 'n7',
      type: 'output',
      position: { x: 100, y: 840 },
      data: {
        label: 'Escalated Response',
        nodeType: 'output',
        config: {
          label: 'Escalated Response',
          outputType: 'text',
          format: '',
        },
      },
    },
    {
      id: 'n8',
      type: 'memory',
      position: { x: 560, y: 360 },
      data: {
        label: 'Store History',
        nodeType: 'memory',
        config: {
          memoryType: 'long_term',
          operation: 'write',
          namespace: 'customer-support',
        },
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'out', targetHandle: 'in' },
    { id: 'e2', source: 'n2', target: 'n3', sourceHandle: 'out', targetHandle: 'in' },
    { id: 'e3', source: 'n3', target: 'n4', sourceHandle: 'out', targetHandle: 'in' },
    { id: 'e4', source: 'n3', target: 'n8', sourceHandle: 'out', targetHandle: 'in', animated: true },
    { id: 'e5', source: 'n4', target: 'n5', sourceHandle: 'true', targetHandle: 'in' },
    { id: 'e6', source: 'n4', target: 'n6', sourceHandle: 'false', targetHandle: 'in' },
    { id: 'e7', source: 'n5', target: 'n7', sourceHandle: 'approved', targetHandle: 'in' },
  ],
};

export const SIMPLE_WORKFLOW: Workflow = {
  id: 'example-simple-qa',
  name: 'Simple Q&A Agent',
  description: 'Basic question and answer workflow',
  tags: ['simple', 'qa'],
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  viewport: { x: 100, y: 80, zoom: 1 },
  nodes: [
    {
      id: 's1',
      type: 'input',
      position: { x: 300, y: 80 },
      data: {
        label: 'Question',
        nodeType: 'input',
        config: {
          label: 'Question',
          description: 'Enter your question',
          inputType: 'text',
          required: true,
          defaultValue: '',
        },
      },
    },
    {
      id: 's2',
      type: 'agent',
      position: { x: 300, y: 240 },
      data: {
        label: 'Q&A Agent',
        nodeType: 'agent',
        config: {
          model: 'claude-opus-4-6',
          systemPrompt: 'You are a knowledgeable assistant. Answer questions clearly and concisely.',
          temperature: 0.5,
          maxTokens: 2048,
          tools: [],
          memory: false,
        },
      },
    },
    {
      id: 's3',
      type: 'output',
      position: { x: 300, y: 400 },
      data: {
        label: 'Answer',
        nodeType: 'output',
        config: {
          label: 'Answer',
          outputType: 'text',
          format: '',
        },
      },
    },
  ],
  edges: [
    { id: 'se1', source: 's1', target: 's2', sourceHandle: 'out', targetHandle: 'in' },
    { id: 'se2', source: 's2', target: 's3', sourceHandle: 'out', targetHandle: 'in' },
  ],
};
