import type { ImportProgressState, ImportStreamEvent } from "@/lib/import/progress";

type CreateImportStreamResponseParams<Result> = {
  run: (emitProgress: (progress: ImportProgressState) => Promise<void>) => Promise<Result>;
  afterComplete?: (result: Result) => Promise<void>;
};

export function createImportStreamResponse<Result>({
  run,
  afterComplete,
}: CreateImportStreamResponseParams<Result>) {
  const encoder = new TextEncoder();

  const serialize = (event: ImportStreamEvent<Result>) =>
    `${JSON.stringify(event)}\n`;

  return new Response(
    new ReadableStream({
      start(controller) {
        const sendEvent = (event: ImportStreamEvent<Result>) => {
          controller.enqueue(encoder.encode(serialize(event)));
        };

        void (async () => {
          try {
            const result = await run(async (progress) => {
              sendEvent({ type: "progress", progress });
            });

            try {
              await afterComplete?.(result);
            } catch (loggingError) {
              console.error("No fue posible registrar la importacion:", loggingError);
            }

            sendEvent({ type: "complete", result });
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : "Error interno del servidor";
            sendEvent({ type: "error", message });
          } finally {
            controller.close();
          }
        })();
      },
    }),
    {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    },
  );
}
