# AlgoViz Backend (Java → DSL, Option C: real execution)

## What this does

Takes plain Java code from the frontend, has an LLM rewrite it with `Trace.*`
calls inserted, then **actually compiles and runs** that rewritten code with
the real JDK. The DSL sent back to the frontend is built from what the
program *actually did* when it ran — not from the LLM predicting/guessing
execution.

## Requirements

- **Node.js 18+**
- **A full JDK (not just a JRE)** — `javac` must be on PATH.
  Check with: `javac -version`
  - Ubuntu/Debian: `sudo apt install openjdk-21-jdk`
  - macOS: `brew install openjdk@21` (then `brew link` and add to PATH)
  - Windows: install Temurin/Adoptium 21, add `bin` to PATH
- An GROQ API key (or swap `llmInstrumenter.js` for your provider of choice)

## Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env, add your ANTHROPIC_API_KEY
npm run dev
```

Server starts on `http://localhost:4000` by default.

## Quick manual test (no frontend needed)

```bash
curl -X POST http://localhost:4000/api/java-to-dsl \
  -H "Content-Type: application/json" \
  -d '{
    "javaCode": "public class Main { public static void main(String[] args) { int[] arr = {5,3,8,1,7}; for (int i=0;i<arr.length-1;i++){ for(int j=0;j<arr.length-i-1;j++){ if(arr[j]>arr[j+1]){ int temp=arr[j]; arr[j]=arr[j+1]; arr[j+1]=temp; } } } } }"
  }'
```

Expected: a JSON response with `"ok": true` and a `"dsl"` field containing
lines like `ARRAY arr [5,3,8,1,7]`, `COMPARE arr 0 1`, `ARRAY_SWAP arr 0 1`, etc.

Compare it against `../src/tests/arrays/bubble.dsl` — that file is a hand
(mechanically) verified ground-truth trace for this exact input, so you can
diff your real output against it.

## What's covered right now

✅ Arrays (`ARRAY`, `ARRAY_SET`, `ARRAY_SWAP`, `COMPARE`)
✅ Pointers (`POINTER`, `MOVE`)
✅ Stack (`STACK`, `STACK_PUSH`, `STACK_POP`)
✅ Queue (`QUEUE`, `QUEUE_ENQUEUE`, `QUEUE_DEQUEUE`)
✅ Plain int variables (`DECLARE`, `SET`)
✅ Simple recursion (`CALL`, `RETURN`) — see `../src/tests/recursion/factorial.dsl`
✅ Graphs (`GRAPH_*`) 
✅  Trees (`TREE_*`)

## What's NOT covered yet (next milestones, in priority order per your goals)

⬜ Linked lists (`LIST_*`)
⬜ HashMap / HashSet (`MAP_*`, `SET_ADD`/`SET_REMOVE`)
⬜ Matrix (`MATRIX_*`)
⬜ Branch visualization (`ENTER_IF`/`EXIT_IF`/`ENTER_ELSE`/`EXIT_ELSE`) — engine
   supports it, nothing emits it yet.

To add any of these: follow the exact same 3-step pattern used for arrays —
(1) add methods to `Trace.java`, (2) document them + add a worked example in
`instrumentationPrompt.js`, (3) add arity/reference rules to `dslValidator.js`.

## Known limitations (read before deploying with real users)

- **Sandboxing is minimal.** `compileAndRun.js` spawns `javac`/`java` as plain
  subprocesses with a timeout and output cap — that is NOT a real security
  sandbox. Before letting real untrusted users submit code, run this inside
  a locked-down container (Docker with no network, restricted filesystem,
  CPU/memory limits, non-root user). Do not run this as-is on a host with
  anything sensitive reachable from it.
- **Int-only.** `Trace.java`'s methods are `int`-typed. Code using doubles,
  Strings as array elements, or generic objects won't instrument cleanly yet.
- **LLM instrumentation can still have gaps** (see main conversation) —
  especially on recursion with multiple simultaneous calls, or unusual code
  shapes. The validator catches malformed traces, not missing-but-valid ones.
  Real program crashes (e.g. genuine ArrayIndexOutOfBoundsException in the
  student's own logic) are surfaced as partial traces + a note, not retried,
  since retrying can't fix a real bug in the student's code.
