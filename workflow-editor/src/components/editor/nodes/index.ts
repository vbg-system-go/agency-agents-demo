import { NodeWrapper } from './NodeWrapper';
import { GroupNode } from './GroupNode';
import type { NodeTypes } from '@xyflow/react';

// All workflow node types share the same NodeWrapper component
// Group is the only exception requiring special resize behavior
export const nodeTypes: NodeTypes = {
  agent: NodeWrapper,
  input: NodeWrapper,
  output: NodeWrapper,
  condition: NodeWrapper,
  router: NodeWrapper,
  tool: NodeWrapper,
  memory: NodeWrapper,
  api_call: NodeWrapper,
  prompt: NodeWrapper,
  approval: NodeWrapper,
  loop: NodeWrapper,
  group: GroupNode,
};
