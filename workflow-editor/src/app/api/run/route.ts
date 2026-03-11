import { NextRequest } from 'next/server';
import { executeWorkflow } from '@/lib/executor';
import type { Workflow } from '@/types';
import type { ApiKeys } from '@/lib/executor';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const workflow: Workflow = body.workflow;
  const userInputs: Record<string, string> = body.inputs ?? {};
  const apiKeys: ApiKeys = {
    anthropic: body.apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY,
    openai: body.apiKeys?.openai || process.env.OPENAI_API_KEY,
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of executeWorkflow(workflow, userInputs, apiKeys)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Execution failed';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'workflow_error', message: msg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
