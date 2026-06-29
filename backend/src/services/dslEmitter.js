/**
 * Converts the raw trace lines captured from running the instrumented
 * program into the final DSL text block that gets sent to the frontend's
 * replayExecution().
 *
 * Trace.java already emits each line in EXACT AlgoViz DSL syntax, so this
 * step is intentionally thin — its job is just to join + do light cleanup,
 * not to reinterpret anything. Keeping this dumb on purpose: any "smart"
 * logic here would re-introduce the exact guessing problem Option C was
 * built to avoid.
 */
export function emitDSL(traceLines) {
  return traceLines
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join("\n");
}
