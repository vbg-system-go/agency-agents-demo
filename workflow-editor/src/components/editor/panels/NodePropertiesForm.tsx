'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/store/workflowStore';
import { NODE_TYPE_REGISTRY } from '@/types/node-registry';
import type { WorkflowNode, AgentConfig, ConditionConfig, ApiCallConfig, LoopConfig, MemoryConfig, ApprovalConfig, PromptConfig, InputConfig, OutputConfig, RouterConfig, LLMProvider } from '@/types';
import type { ModelsResponse, ModelOption } from '@/app/api/models/route';
import { Trash2 } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';

interface Props {
  node: WorkflowNode;
}

export function NodePropertiesForm({ node }: Props) {
  const { updateNode, deleteNodes } = useWorkflowStore();
  const { clearSelection } = useEditorStore();
  const def = NODE_TYPE_REGISTRY[node.type];

  const update = useCallback(
    (patch: Partial<WorkflowNode['data']>) => {
      updateNode(node.id, patch);
    },
    [node.id, updateNode]
  );

  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNode(node.id, { config: { ...node.data.config, ...patch } });
    },
    [node.id, node.data.config, updateNode]
  );

  const handleDelete = () => {
    deleteNodes([node.id]);
    clearSelection();
  };

  if (!def) return null;

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Node identity */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={def.color as 'violet'}>{def.label}</Badge>
          <span className="text-xs text-zinc-400">{node.id.slice(0, 8)}</span>
        </div>

        <Input
          label="Label"
          value={node.data.label}
          onChange={(e) => update({ label: e.target.value })}
          placeholder={def.label}
        />
        <Textarea
          label="Notes"
          value={node.data.notes ?? ''}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Optional notes about this node..."
          className="min-h-[60px]"
        />
      </section>

      {/* Divider */}
      <hr className="border-zinc-100" />

      {/* Type-specific config */}
      <section className="space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Configuration
        </p>
        <NodeConfigFields node={node} updateConfig={updateConfig} />
      </section>

      {/* Validation errors */}
      {node.data.validation && !node.data.validation.isValid && (
        <>
          <hr className="border-zinc-100" />
          <section className="space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Issues
            </p>
            {node.data.validation.errors.map((err, i) => (
              <div
                key={i}
                className={`rounded-md px-3 py-2 text-xs ${
                  err.severity === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}
              >
                {err.message}
              </div>
            ))}
          </section>
        </>
      )}

      {/* Delete */}
      <hr className="border-zinc-100" />
      <Button
        variant="danger"
        size="sm"
        className="w-full"
        onClick={handleDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete Node
      </Button>
    </div>
  );
}

// ─── Config field renderers ────────────────────────────────────────────────────

interface ConfigProps {
  node: WorkflowNode;
  updateConfig: (patch: Record<string, unknown>) => void;
}

function NodeConfigFields({ node, updateConfig }: ConfigProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = node.data.config as any;

  switch (node.type) {
    case 'agent':
      return <AgentFields config={config as Partial<AgentConfig>} update={updateConfig} />;
    case 'input':
      return <InputFields config={config as Partial<InputConfig>} update={updateConfig} />;
    case 'output':
      return <OutputFields config={config as Partial<OutputConfig>} update={updateConfig} />;
    case 'condition':
      return <ConditionFields config={config as Partial<ConditionConfig>} update={updateConfig} />;
    case 'router':
      return <RouterFields config={config as Partial<RouterConfig>} update={updateConfig} />;
    case 'api_call':
      return <ApiCallFields config={config as Partial<ApiCallConfig>} update={updateConfig} />;
    case 'memory':
      return <MemoryFields config={config as Partial<MemoryConfig>} update={updateConfig} />;
    case 'prompt':
      return <PromptFields config={config as Partial<PromptConfig>} update={updateConfig} />;
    case 'approval':
      return <ApprovalFields config={config as Partial<ApprovalConfig>} update={updateConfig} />;
    case 'loop':
      return <LoopFields config={config as Partial<LoopConfig>} update={updateConfig} />;
    default:
      return <p className="text-xs text-zinc-400">No configuration options for this node type.</p>;
  }
}

// ─── Model catalog (fetched once from /api/models) ────────────────────────────

let _modelsCache: ModelsResponse | null = null;

async function fetchModels(): Promise<ModelsResponse> {
  if (_modelsCache) return _modelsCache;
  const res = await fetch('/api/models');
  if (!res.ok) throw new Error('Failed to fetch models');
  _modelsCache = await res.json() as ModelsResponse;
  return _modelsCache;
}

function toSelectOptions(models: ModelOption[]) {
  return models.map((m) => ({ value: m.id, label: m.label }));
}

function AgentFields({ config, update }: { config: Partial<AgentConfig>; update: (p: Record<string, unknown>) => void }) {
  const provider: LLMProvider = config.provider ?? 'anthropic';

  const [allModels, setAllModels] = useState<ModelsResponse | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    setLoadingModels(true);
    fetchModels()
      .then(setAllModels)
      .catch(() => setAllModels(null))
      .finally(() => setLoadingModels(false));
  }, []);

  const providerModels: { value: string; label: string }[] = allModels
    ? toSelectOptions(allModels[provider])
    : provider === 'anthropic'
      ? [
          { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
          { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
          { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
        ]
      : [
          { value: 'gpt-4o', label: 'GPT-4o' },
          { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        ];

  const handleProviderChange = (newProvider: string) => {
    const newModels = allModels ? allModels[newProvider as LLMProvider] : [];
    const defaultModel = newModels[0]?.id ?? '';
    update({ provider: newProvider, model: defaultModel });
  };

  return (
    <div className="space-y-3">
      <Select
        label="Provider"
        value={provider}
        onChange={(e) => handleProviderChange(e.target.value)}
        options={[
          { value: 'anthropic', label: 'Anthropic (Claude)' },
          { value: 'openai', label: 'OpenAI (GPT / o-series)' },
        ]}
      />
      <Select
        label={loadingModels ? 'Model (loading…)' : 'Model'}
        value={config.model ?? providerModels[0]?.value ?? ''}
        onChange={(e) => update({ model: e.target.value })}
        options={providerModels}
        disabled={loadingModels}
      />
      <Textarea
        label="System Prompt"
        value={config.systemPrompt ?? ''}
        onChange={(e) => update({ systemPrompt: e.target.value })}
        placeholder="You are a helpful assistant..."
        className="min-h-[100px]"
      />
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600">
          Temperature: {config.temperature ?? 0.7}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.temperature ?? 0.7}
          onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none bg-zinc-200 accent-violet-600"
        />
        <div className="flex justify-between text-[10px] text-zinc-400">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>
      <Input
        label="Max Tokens"
        type="number"
        value={config.maxTokens ?? 4096}
        onChange={(e) => update({ maxTokens: parseInt(e.target.value) })}
        min={1}
        max={200000}
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="agent-memory"
          checked={config.memory ?? false}
          onChange={(e) => update({ memory: e.target.checked })}
          className="rounded accent-violet-600"
        />
        <label htmlFor="agent-memory" className="text-xs text-zinc-700">
          Enable memory
        </label>
      </div>
    </div>
  );
}

function InputFields({ config, update }: { config: Partial<InputConfig>; update: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Input
        label="Input Label"
        value={config.label ?? ''}
        onChange={(e) => update({ label: e.target.value })}
        placeholder="User Input"
      />
      <Textarea
        label="Description"
        value={config.description ?? ''}
        onChange={(e) => update({ description: e.target.value })}
        placeholder="Describe what this input expects..."
        className="min-h-[60px]"
      />
      <Select
        label="Input Type"
        value={config.inputType ?? 'text'}
        onChange={(e) => update({ inputType: e.target.value })}
        options={[
          { value: 'text', label: 'Text' },
          { value: 'json', label: 'JSON' },
          { value: 'number', label: 'Number' },
          { value: 'file', label: 'File' },
        ]}
      />
      <Input
        label="Default Value"
        value={config.defaultValue ?? ''}
        onChange={(e) => update({ defaultValue: e.target.value })}
        placeholder="Optional default..."
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="input-required"
          checked={config.required ?? true}
          onChange={(e) => update({ required: e.target.checked })}
          className="rounded accent-violet-600"
        />
        <label htmlFor="input-required" className="text-xs text-zinc-700">Required</label>
      </div>
    </div>
  );
}

function OutputFields({ config, update }: { config: Partial<OutputConfig>; update: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Input
        label="Output Label"
        value={config.label ?? ''}
        onChange={(e) => update({ label: e.target.value })}
        placeholder="Result"
      />
      <Select
        label="Output Type"
        value={config.outputType ?? 'text'}
        onChange={(e) => update({ outputType: e.target.value })}
        options={[
          { value: 'text', label: 'Text' },
          { value: 'json', label: 'JSON' },
          { value: 'stream', label: 'Stream' },
        ]}
      />
    </div>
  );
}

function ConditionFields({ config, update }: { config: Partial<ConditionConfig>; update: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Textarea
        label="Expression"
        value={config.expression ?? ''}
        onChange={(e) => update({ expression: e.target.value })}
        placeholder="{{ variable == 'value' }}"
        hint="Use Jinja2 template syntax"
        className="min-h-[80px] font-mono text-xs"
      />
      <Select
        label="Language"
        value={config.language ?? 'jinja2'}
        onChange={(e) => update({ language: e.target.value })}
        options={[
          { value: 'jinja2', label: 'Jinja2' },
          { value: 'javascript', label: 'JavaScript' },
          { value: 'python', label: 'Python' },
        ]}
      />
      <Input
        label="True Branch Label"
        value={config.trueLabel ?? 'True'}
        onChange={(e) => update({ trueLabel: e.target.value })}
      />
      <Input
        label="False Branch Label"
        value={config.falseLabel ?? 'False'}
        onChange={(e) => update({ falseLabel: e.target.value })}
      />
    </div>
  );
}

function RouterFields({ config, update }: { config: Partial<RouterConfig>; update: (p: Record<string, unknown>) => void }) {
  const routes = config.routes ?? [];
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-600">Routes</p>
        {routes.map((route, i) => (
          <div key={route.id} className="flex gap-2 items-center">
            <Input
              value={route.label}
              onChange={(e) => {
                const updated = routes.map((r, idx) =>
                  idx === i ? { ...r, label: e.target.value } : r
                );
                update({ routes: updated });
              }}
              placeholder={`Route ${i + 1}`}
            />
            <button
              className="text-zinc-400 hover:text-red-500 transition-colors"
              onClick={() => update({ routes: routes.filter((_, idx) => idx !== i) })}
            >
              ×
            </button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => update({ routes: [...routes, { id: `route-${routes.length + 1}`, label: `Route ${routes.length + 1}`, condition: '' }] })}
        >
          + Add Route
        </Button>
      </div>
    </div>
  );
}

function ApiCallFields({ config, update }: { config: Partial<ApiCallConfig>; update: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select
          label="Method"
          value={config.method ?? 'GET'}
          onChange={(e) => update({ method: e.target.value })}
          options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({ value: m, label: m }))}
          className="w-28 shrink-0"
        />
        <div className="flex-1">
          <Input
            label="URL"
            value={config.url ?? ''}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="https://api.example.com/endpoint"
          />
        </div>
      </div>
      <Select
        label="Auth Type"
        value={config.authType ?? 'none'}
        onChange={(e) => update({ authType: e.target.value })}
        options={[
          { value: 'none', label: 'None' },
          { value: 'bearer', label: 'Bearer Token' },
          { value: 'api_key', label: 'API Key' },
          { value: 'basic', label: 'Basic Auth' },
        ]}
      />
      {config.authType !== 'none' && (
        <Input
          label="Auth Value"
          type="password"
          value={config.authValue ?? ''}
          onChange={(e) => update({ authValue: e.target.value })}
          placeholder="Token or key..."
        />
      )}
      <Textarea
        label="Request Body Template"
        value={config.bodyTemplate ?? ''}
        onChange={(e) => update({ bodyTemplate: e.target.value })}
        placeholder='{"key": "{{ variable }}"}'
        className="min-h-[80px] font-mono text-xs"
      />
      <Input
        label="Timeout (ms)"
        type="number"
        value={config.timeoutMs ?? 30000}
        onChange={(e) => update({ timeoutMs: parseInt(e.target.value) })}
      />
    </div>
  );
}

function MemoryFields({ config, update }: { config: Partial<MemoryConfig>; update: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Select
        label="Memory Type"
        value={config.memoryType ?? 'short_term'}
        onChange={(e) => update({ memoryType: e.target.value })}
        options={[
          { value: 'short_term', label: 'Short-term' },
          { value: 'long_term', label: 'Long-term' },
          { value: 'vector', label: 'Vector Store' },
          { value: 'graph', label: 'Graph Memory' },
        ]}
      />
      <Select
        label="Operation"
        value={config.operation ?? 'read'}
        onChange={(e) => update({ operation: e.target.value })}
        options={[
          { value: 'read', label: 'Read' },
          { value: 'write', label: 'Write' },
          { value: 'search', label: 'Search' },
          { value: 'clear', label: 'Clear' },
        ]}
      />
      <Input
        label="Namespace"
        value={config.namespace ?? 'default'}
        onChange={(e) => update({ namespace: e.target.value })}
        placeholder="default"
      />
    </div>
  );
}

function PromptFields({ config, update }: { config: Partial<PromptConfig>; update: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Textarea
        label="Template"
        value={config.template ?? ''}
        onChange={(e) => update({ template: e.target.value })}
        placeholder="Hello {{ name }}, please help with {{ task }}"
        hint="Use {{ variable }} for dynamic values"
        className="min-h-[120px] font-mono text-xs"
      />
      <Select
        label="Language"
        value={config.language ?? 'jinja2'}
        onChange={(e) => update({ language: e.target.value })}
        options={[
          { value: 'jinja2', label: 'Jinja2' },
          { value: 'f-string', label: 'F-string' },
          { value: 'mustache', label: 'Mustache' },
        ]}
      />
      <Input
        label="Output Variable"
        value={config.outputVariable ?? 'prompt'}
        onChange={(e) => update({ outputVariable: e.target.value })}
        placeholder="prompt"
      />
    </div>
  );
}

function ApprovalFields({ config, update }: { config: Partial<ApprovalConfig>; update: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Textarea
        label="Approval Message"
        value={config.message ?? ''}
        onChange={(e) => update({ message: e.target.value })}
        placeholder="Please review and approve..."
        className="min-h-[80px]"
      />
      <Input
        label="Approvers (comma-separated emails)"
        value={(config.approvers ?? []).join(', ')}
        onChange={(e) =>
          update({ approvers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
        }
        placeholder="reviewer@company.com"
      />
      <Input
        label="Timeout (hours)"
        type="number"
        value={config.timeoutHours ?? 24}
        onChange={(e) => update({ timeoutHours: parseInt(e.target.value) })}
        min={1}
      />
      <Select
        label="On Timeout"
        value={config.onTimeout ?? 'reject'}
        onChange={(e) => update({ onTimeout: e.target.value })}
        options={[
          { value: 'reject', label: 'Auto-reject' },
          { value: 'approve', label: 'Auto-approve' },
          { value: 'escalate', label: 'Escalate' },
        ]}
      />
    </div>
  );
}

function LoopFields({ config, update }: { config: Partial<LoopConfig>; update: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Select
        label="Loop Type"
        value={config.loopType ?? 'for_each'}
        onChange={(e) => update({ loopType: e.target.value })}
        options={[
          { value: 'for_each', label: 'For Each' },
          { value: 'while', label: 'While' },
          { value: 'fixed', label: 'Fixed Count' },
        ]}
      />
      {config.loopType === 'for_each' && (
        <>
          <Input
            label="Iterable Variable"
            value={config.iterableVar ?? ''}
            onChange={(e) => update({ iterableVar: e.target.value })}
            placeholder="items"
          />
          <Input
            label="Item Variable"
            value={config.itemVar ?? 'item'}
            onChange={(e) => update({ itemVar: e.target.value })}
            placeholder="item"
          />
        </>
      )}
      {config.loopType === 'while' && (
        <Textarea
          label="Condition"
          value={config.condition ?? ''}
          onChange={(e) => update({ condition: e.target.value })}
          placeholder="{{ continue == true }}"
          className="min-h-[60px] font-mono text-xs"
        />
      )}
      <Input
        label="Max Iterations"
        type="number"
        value={config.maxIterations ?? 100}
        onChange={(e) => update({ maxIterations: parseInt(e.target.value) })}
        min={1}
        max={10000}
        hint="Safety limit to prevent infinite loops"
      />
    </div>
  );
}
