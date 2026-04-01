export type ImportProgressState = {
  processed: number;
  total: number;
  success: number;
  errors: number;
  percentage: number;
};

export type ImportProgressOptions = {
  onProgress?: (progress: ImportProgressState) => void | Promise<void>;
};

export type ImportProgressEvent = {
  type: "progress";
  progress: ImportProgressState;
};

export type ImportCompleteEvent<Result> = {
  type: "complete";
  result: Result;
};

export type ImportErrorEvent = {
  type: "error";
  message: string;
};

export type ImportStreamEvent<Result> =
  | ImportProgressEvent
  | ImportCompleteEvent<Result>
  | ImportErrorEvent;

export function buildImportProgress(
  processed: number,
  total: number,
  success: number,
  errors: number,
): ImportProgressState {
  const safeTotal = Math.max(total, 0);
  const safeProcessed = Math.min(Math.max(processed, 0), safeTotal);
  const percentage =
    safeTotal === 0 ? 100 : Math.round((safeProcessed / safeTotal) * 100);

  return {
    processed: safeProcessed,
    total: safeTotal,
    success: Math.max(success, 0),
    errors: Math.max(errors, 0),
    percentage,
  };
}
