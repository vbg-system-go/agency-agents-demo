import { NextRequest } from 'next/server';
import { executeWorkflow } from '@/lib/executor';
import type { Workflow } from '@/types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const workflow: Workflow = body.workflow;
  const userInputs: Record<string, string> = body.inputs ?? {};
  const apiKey: string = body.apiKey ?? process.env.ANTHROPIC_API_KEY ?? '';

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'No API key provided. Set ANTHROPIC_API_KEY or enter one in the Run panel.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of executeWorkflow(workflow, userInputs, apiKey)) {
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
