import { Router } from "express";
import { instrumentJavaCode } from "../services/llmInstrumenter.js";
import { compileAndRun } from "../services/compileAndRun.js";
import { validateDSL, formatErrorsForRetry } from "../services/dslValidator.js";
import { emitDSL } from "../services/dslEmitter.js";

const router = Router();

const MAX_ATTEMPTS = 3;

router.post("/java-to-dsl", async (req, res) => {
  const { javaCode } = req.body;

  if (!javaCode || typeof javaCode !== "string" || !javaCode.trim()) {
    return res.status(400).json({ ok: false, error: "javaCode is required" });
  }

  let lastError = null;
  let lastInstrumentedSource = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[java-to-dsl] Attempt ${attempt} starting...`);

      const instrumented = await instrumentJavaCode(javaCode, {
        feedback: lastError,
      });
      lastInstrumentedSource = instrumented;
      console.log(`[java-to-dsl] Attempt ${attempt}: instrumentation received, length=${instrumented.length}`);

      const runResult = await compileAndRun(instrumented);
      console.log(`[java-to-dsl] Attempt ${attempt}: compileAndRun result ok=${runResult.ok} stage=${runResult.stage || "n/a"}`);

      if (!runResult.ok) {
        if (runResult.stage === "compile") {
          lastError = `Compilation failed:\n${runResult.error}`;
          console.log(`[java-to-dsl] Attempt ${attempt}: COMPILE ERROR:\n${runResult.error}`);
          continue;
        }

        const partialDsl = emitDSL(runResult.partialTraceLines || []);
        return res.json({
          ok: true,
          dsl: partialDsl,
          programCrashed: true,
          crashMessage: runResult.error,
          programOutput: runResult.programOutput || "",
          attempt,
          note:
            "Your program crashed during execution. The trace below shows everything that happened right up until the crash — this may be exactly the bug you're looking for.",
        });
      }

      const dsl = emitDSL(runResult.traceLines);

      if (!dsl.trim()) {
        lastError =
          "The program ran successfully but produced ZERO Trace.* calls. " +
          "You likely forgot to insert any instrumentation. Review the code " +
          "and add Trace calls for every array/stack/queue/pointer/variable " +
          "operation and every recursive call, per the rules.";
        console.log(`[java-to-dsl] Attempt ${attempt}: ZERO trace lines produced.`);
        continue;
      }

      const validation = validateDSL(dsl);

      if (!validation.ok) {
        lastError =
          "The generated trace has structural problems:\n" +
          formatErrorsForRetry(validation.errors) +
          "\n\nFix the instrumentation (not the program's logic) so every " +
          "reference is declared before use and every CALL has a matching RETURN.";
        console.log(`[java-to-dsl] Attempt ${attempt}: VALIDATION FAILED:\n${formatErrorsForRetry(validation.errors)}`);
        continue;
      }

      console.log(`[java-to-dsl] Attempt ${attempt}: SUCCESS`);
      return res.json({
        ok: true,
        dsl,
        programCrashed: false,
        programOutput: runResult.programOutput || "",
        attempt,
      });
    } catch (err) {
      lastError = err.message || String(err);
      console.log(`[java-to-dsl] Attempt ${attempt}: THREW EXCEPTION: ${lastError}`);
    }
  }

  console.error("[java-to-dsl] Failed after", MAX_ATTEMPTS, "attempts.");
  console.error("[java-to-dsl] lastError:", lastError);
  if (lastInstrumentedSource) {
    console.error("[java-to-dsl] lastInstrumentedSource:\n", lastInstrumentedSource);
  }

  return res.status(422).json({
    ok: false,
    error:
      "Could not produce a valid trace after multiple attempts. This usually " +
      "means the code uses a pattern not yet supported (e.g. trees, graphs, " +
      "hashmaps/sets, matrices, or non-int data).",
    lastError,
    lastInstrumentedSource,
  });
});

export default router;