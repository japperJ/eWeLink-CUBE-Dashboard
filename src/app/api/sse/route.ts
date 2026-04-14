import { getSSEUrl } from "@/lib/cube-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sseUrl = getSSEUrl();

  const encoder = new TextEncoder();
  const abortController = new AbortController();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const safeClose = () => {
        if (closed) return;
        closed = true;

        try {
          controller.close();
        } catch {
          // Ignore double-close attempts when the client disconnects.
        }
      };

      const safeEnqueue = (text: string) => {
        if (closed) return;

        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          safeClose();
        }
      };

      request.signal.addEventListener(
        "abort",
        () => {
          abortController.abort();
          safeClose();
        },
        { once: true }
      );

      try {
        const res = await fetch(sseUrl, {
          headers: { Accept: "text/event-stream" },
          cache: "no-store",
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          safeEnqueue(
            `data: ${JSON.stringify({ error: "Failed to connect to CUBE SSE" })}\n\n`
          );
          safeClose();
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
              safeEnqueue(text);
            }
          } catch {
            // Connection closed
          } finally {
            try {
              await reader.cancel();
            } catch {
              // Ignore reader cancellation errors during shutdown.
            }

            safeClose();
          }
        };

        pump();
      } catch {
        if (!request.signal.aborted) {
          safeEnqueue(
            `data: ${JSON.stringify({ error: "SSE connection failed" })}\n\n`
          );
        }

        safeClose();
      }
    },

    cancel() {
      abortController.abort();
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
