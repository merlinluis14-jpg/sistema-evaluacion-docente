import type {
  ImportProgressState,
  ImportStreamEvent,
} from "@/lib/import/progress";

type StreamImportParams = {
  url: string;
  body: Record<string, unknown>;
  onProgress?: (progress: ImportProgressState) => void;
};

export async function runStreamedImport<Result>({
  url,
  body,
  onProgress,
}: StreamImportParams): Promise<Result> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.message || "Error en el servidor");
  }

  if (!response.body) {
    throw new Error("El servidor no pudo enviar el progreso de la importación");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: Result | null = null;

  const processLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    const event = JSON.parse(trimmed) as ImportStreamEvent<Result>;
    if (event.type === "progress") {
      onProgress?.(event.progress);
      return;
    }

    if (event.type === "error") {
      throw new Error(event.message);
    }

    result = event.result;
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    let lineBreakIndex = buffer.indexOf("\n");

    while (lineBreakIndex >= 0) {
      processLine(buffer.slice(0, lineBreakIndex));
      buffer = buffer.slice(lineBreakIndex + 1);
      lineBreakIndex = buffer.indexOf("\n");
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    processLine(buffer);
  }

  if (!result) {
    throw new Error("La importación terminó sin devolver un resultado");
  }

  return result;
}
