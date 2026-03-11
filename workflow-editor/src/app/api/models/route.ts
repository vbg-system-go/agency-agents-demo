import { NextResponse } from 'next/server';

export interface ModelPricing {
  inputPer1M: number | null;   // USD per 1M input tokens
  outputPer1M: number | null;  // USD per 1M output tokens
}

export interface ModelOption {
  id: string;
  label: string;
  pricing: ModelPricing;
  contextWindow?: number;
  description?: string;
}

export interface ModelsResponse {
  anthropic: ModelOption[];
  openai: ModelOption[];
}

// ─── Static Anthropic models (no public list API) ─────────────────────────────

const ANTHROPIC_MODELS: ModelOption[] = [
  {
    id: 'claude-opus-4-6',
    label: 'Claude Opus 4.6',
    description: 'Most capable',
    pricing: { inputPer1M: 15.0, outputPer1M: 75.0 },
    contextWindow: 200000,
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6',
    description: 'Balanced',
    pricing: { inputPer1M: 3.0, outputPer1M: 15.0 },
    contextWindow: 200000,
  },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Claude Haiku 4.5',
    description: 'Fast & cheap',
    pricing: { inputPer1M: 0.8, outputPer1M: 4.0 },
    contextWindow: 200000,
  },
];

// ─── Known OpenAI pricing (USD per 1M tokens) ─────────────────────────────────
// Updated: March 2026. Fallback for models not in this map is null (unknown).

const OPENAI_PRICING: Record<string, ModelPricing> = {
  'gpt-4.1':                  { inputPer1M: 2.00,  outputPer1M: 8.00 },
  'gpt-4.1-mini':             { inputPer1M: 0.40,  outputPer1M: 1.60 },
  'gpt-4.1-nano':             { inputPer1M: 0.10,  outputPer1M: 0.40 },
  'gpt-4o':                   { inputPer1M: 2.50,  outputPer1M: 10.00 },
  'gpt-4o-mini':              { inputPer1M: 0.15,  outputPer1M: 0.60 },
  'gpt-4-turbo':              { inputPer1M: 10.00, outputPer1M: 30.00 },
  'gpt-4-turbo-preview':      { inputPer1M: 10.00, outputPer1M: 30.00 },
  'gpt-4':                    { inputPer1M: 30.00, outputPer1M: 60.00 },
  'gpt-3.5-turbo':            { inputPer1M: 0.50,  outputPer1M: 1.50 },
  'o1':                       { inputPer1M: 15.00, outputPer1M: 60.00 },
  'o1-mini':                  { inputPer1M: 1.10,  outputPer1M: 4.40 },
  'o1-preview':               { inputPer1M: 15.00, outputPer1M: 60.00 },
  'o3':                       { inputPer1M: 10.00, outputPer1M: 40.00 },
  'o3-mini':                  { inputPer1M: 1.10,  outputPer1M: 4.40 },
  'o4-mini':                  { inputPer1M: 1.10,  outputPer1M: 4.40 },
  'gpt-5':                    { inputPer1M: null,   outputPer1M: null },
  'gpt-5-mini':               { inputPer1M: null,   outputPer1M: null },
  'gpt-5-nano':               { inputPer1M: null,   outputPer1M: null },
};

// Models to exclude from the list (utility/embedding/audio/etc.)
const OPENAI_EXCLUDE_PREFIXES = [
  'text-embedding',
  'text-moderation',
  'whisper',
  'tts',
  'dall-e',
  'davinci',
  'babbage',
  'curie',
  'ada',
  'ft:',
];

const OPENAI_INCLUDE_PREFIXES = [
  'gpt-',
  'o1',
  'o3',
  'o4',
  'chatgpt-',
];

function formatPrice(price: number | null): string {
  if (price === null) return '?';
  if (price < 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(2)}`;
}

function buildLabel(id: string, pricing: ModelPricing): string {
  const priceStr =
    pricing.inputPer1M !== null && pricing.outputPer1M !== null
      ? ` · $${formatPrice(pricing.inputPer1M)}/$${formatPrice(pricing.outputPer1M)} per 1M`
      : '';
  return `${id}${priceStr}`;
}

export async function GET() {
  const openaiKey = process.env.OPENAI_API_KEY;

  let openaiModels: ModelOption[] = [];

  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${openaiKey}` },
        next: { revalidate: 3600 }, // cache 1 hour
      });

      if (res.ok) {
        const data = await res.json() as { data: Array<{ id: string; created: number }> };

        const chatModels = data.data
          .filter((m) => {
            const id = m.id.toLowerCase();
            // Exclude utility models
            if (OPENAI_EXCLUDE_PREFIXES.some((p) => id.startsWith(p))) return false;
            // Only include chat/reasoning models
            return OPENAI_INCLUDE_PREFIXES.some((p) => id.startsWith(p));
          })
          // Sort by creation date descending (newest first)
          .sort((a, b) => b.created - a.created);

        openaiModels = chatModels.map((m) => {
          const pricing: ModelPricing = OPENAI_PRICING[m.id] ?? { inputPer1M: null, outputPer1M: null };
          return {
            id: m.id,
            label: buildLabel(m.id, pricing),
            pricing,
          };
        });
      }
    } catch {
      // Fall through to static fallback
    }
  }

  // Static fallback if no key or API call failed
  if (openaiModels.length === 0) {
    const fallbackIds = [
      'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
      'gpt-4o', 'gpt-4o-mini',
      'o1', 'o1-mini', 'o3', 'o3-mini', 'o4-mini',
    ];
    openaiModels = fallbackIds.map((id) => {
      const pricing = OPENAI_PRICING[id] ?? { inputPer1M: null, outputPer1M: null };
      return { id, label: buildLabel(id, pricing), pricing };
    });
  }

  const anthropicModels: ModelOption[] = ANTHROPIC_MODELS.map((m) => ({
    ...m,
    label: buildLabel(m.id, m.pricing) + (m.description ? ` (${m.description})` : ''),
  }));

  return NextResponse.json({ anthropic: anthropicModels, openai: openaiModels } satisfies ModelsResponse);
}
