import { getSSEUrl } from "@/lib/cube-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const sseUrl = getSSEUrl();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(sseUrl, {
          headers: { Accept: "text/event-stream" },
          cache: "no-store",
        });

        if (!res.ok || !res.body) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Failed to connect to CUBE SSE" })}\n\n`
            )
          );
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const text = decoder.decode(value, { stream: true });
              controller.enqueue(encoder.encode(text));
            }
          } catch {
            // Connection closed
          } finally {
            controller.close();
          }
        };

        pump();
      } catch {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "SSE connection failed" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
