// Shared model/pricing types used by both the API route and the client UI.
// This file must stay free of server-only imports so it can be imported from client components.

export interface ModelPricing {
  inputPer1M: number | null;  // USD per 1M input tokens
  outputPer1M: number | null; // USD per 1M output tokens
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
