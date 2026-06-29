import { spawn } from "child_process";
import { mkdtemp, writeFile, rm, readFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { fileURLToPath } from "url";

const TRACE_JAVA_SRC = fileURLToPath(
  new URL("../java-runtime/Trace.java", import.meta.url)
);
const COMPILE_TIMEOUT_MS = 10_000;
const RUN_TIMEOUT_MS = 8_000;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024; // 2MB safety cap on captured output

const TRACE_PREFIX = "##ALGOVIZ##";

/**
 * Runs a child process with a hard timeout and output size cap.
 * Resolves with { stdout, stderr, code, timedOut }.
 */
function runProcess(cmd, args, { cwd, timeoutMs, input = null }) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      // No shell, no inherited env secrets beyond what's needed, no network
      // assumptions here — true network isolation should be enforced at the
      // container/OS level wherever this backend is actually deployed.
      env: {
          ...process.env,
          LANG: "C.UTF-8",
          LC_ALL: "C.UTF-8",
      },
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let killedForSize = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += chunk.toString();
      } else if (!killedForSize) {
        killedForSize = true;
        child.kill("SIGKILL");
      }
    });

    child.stderr.on("data", (chunk) => {
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += chunk.toString();
      }
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code, timedOut, killedForSize });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: stderr + "\n" + err.message, code: -1, timedOut, killedForSize });
    });

    if (input != null) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}

/**
 * Compiles and runs instrumented Java source in an isolated temp directory.
 *
 * Returns:
 *   { ok: true, traceLines: string[], stdout: string, stderr: string }
 *   { ok: false, stage: "compile"|"run", error: string }
 *
 * SECURITY NOTE: This spawns javac/java as plain subprocesses with a timeout
 * and output cap. That is NOT a full sandbox. Before exposing this to real,
 * untrusted users in production, run this inside a locked-down container
 * (no network, restricted filesystem, CPU/memory limits, non-root user,
 * e.g. via Docker/gVisor/firecracker) — do not run it directly on a host
 * that has anything sensitive reachable from it.
 */
export async function compileAndRun(instrumentedJavaSource) {
  const dir = await mkdtemp(path.join(tmpdir(), "algoviz-"));

  try {
    const mainPath = path.join(dir, "Main.java");
    const tracePath = path.join(dir, "Trace.java");

    await writeFile(mainPath, instrumentedJavaSource, "utf8");

    const traceSrc = await readFile(TRACE_JAVA_SRC, "utf8");
    await writeFile(tracePath, traceSrc, "utf8");

    // ---- COMPILE ----
    const compileResult = await runProcess(
    "javac",
    [
      "-encoding",
      "UTF-8",
      "Main.java",
      "Trace.java"
    ],
    {
      cwd: dir,
      timeoutMs: COMPILE_TIMEOUT_MS,
    }
  );

    if (compileResult.timedOut) {
      return { ok: false, stage: "compile", error: "Compilation timed out." };
    }
    if (compileResult.code !== 0) {
      return {
        ok: false,
        stage: "compile",
        error: compileResult.stderr || "Unknown compile error",
      };
    }

    // ---- RUN ----
    const runResult = await runProcess(
    "java",
    [
      "-Dfile.encoding=UTF-8",
      "-cp",
      dir,
      "Main"
    ],
    {
      cwd: dir,
      timeoutMs: RUN_TIMEOUT_MS,
    }
  );

    if (runResult.timedOut) {
      return {
        ok: false,
        stage: "run",
        error:
          "Program did not finish within the time limit (possible infinite loop or unbounded recursion).",
      };
    }

    // Separate trace lines from the student's own System.out.println output.
    const allLines = runResult.stdout.split("\n");
    const traceLines = [];
    const programOutputLines = [];

    for (const line of allLines) {
      if (line.startsWith(TRACE_PREFIX)) {
        traceLines.push(line.slice(TRACE_PREFIX.length));
      } else if (line.trim().length > 0) {
        programOutputLines.push(line);
      }
    }

    if (runResult.code !== 0) {
      // Program crashed at runtime (e.g. real ArrayIndexOutOfBoundsException).
      // We still return whatever trace was captured before the crash, since
      // that's genuinely useful ("here's what happened right up to your bug").
      return {
        ok: false,
        stage: "run",
        error: runResult.stderr || `Program exited with code ${runResult.code}`,
        partialTraceLines: traceLines,
        programOutput: programOutputLines.join("\n"),
      };
    }

    return {
      ok: true,
      traceLines,
      programOutput: programOutputLines.join("\n"),
      stderr: runResult.stderr,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
