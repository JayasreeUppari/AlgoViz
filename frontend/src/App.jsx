import { useState, useEffect, useRef } from "react";
import { replayExecution } from "./core/replayEngine";
import { getStateAt, getMessage } from "./core/stateEngine";

import ArrayDisplay from "./components/visualizers/ArrayDisplay";
import StackDisplay from "./components/visualizers/StackDisplay";
import QueueDisplay from "./components/visualizers/QueueDisplay";
import LinkedListDisplay from "./components/visualizers/LinkedListDisplay";
import VariablesDisplay from "./components/visualizers/VariablesDisplay";
import CallStackDisplay from "./components/visualizers/CallStackDisplay";
import HashMapDisplay from "./components/visualizers/HashMapDisplay";
import HashSetDisplay from "./components/visualizers/HashSetDisplay";
import TreeDisplay from "./components/visualizers/TreeDisplay";
import GraphDisplay from "./components/visualizers/GraphDisplay";
import MatrixDisplay from "./components/visualizers/MatrixDisplay";
import ErrorPanel from "./components/ErrorPanel";
import "./styles/App.css";

export default function App() {
  const [code, setCode] = useState(`DECLARE x 10
DECLARE y 20

SET x 50
SET y 100
`);

  const [steps, setSteps] = useState([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);

  // =========================
  // JAVA -> DSL (AI layer)
  // =========================
  const [inputMode, setInputMode] = useState("dsl"); // "dsl" | "java"
  const [javaCode, setJavaCode] = useState(
    `public class Main {\n    public static void main(String[] args) {\n        int[] arr = {5, 3, 8, 1, 7};\n        for (int i = 0; i < arr.length - 1; i++) {\n            for (int j = 0; j < arr.length - i - 1; j++) {\n                if (arr[j] > arr[j + 1]) {\n                    int temp = arr[j];\n                    arr[j] = arr[j + 1];\n                    arr[j + 1] = temp;\n                }\n            }\n        }\n    }\n}\n`
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiNote, setAiNote] = useState(null);
  const [generatedDsl, setGeneratedDsl] = useState("");

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  async function convertJavaAndVisualize() {
    setAiLoading(true);
    setAiError(null);
    setAiNote(null);
    setGeneratedDsl("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/java-to-dsl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ javaCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        const detail = data.lastError ? `\n\nDetail: ${data.lastError}` : "";
        setAiError((data.error || "Failed to convert Java code.") + detail);
        if (data.lastInstrumentedSource) {
          console.log(
            "Last instrumented source the LLM produced (for debugging):\n",
            data.lastInstrumentedSource
          );
        }
        return;
      }

      setGeneratedDsl(data.dsl);
      if (data.note) setAiNote(data.note);

      // Feed straight into the existing, unmodified DSL pipeline.
      setCode(data.dsl);
      const events = replayExecution(data.dsl);
      setSteps(events);
      setCurrent(0);
    } catch (err) {
      setAiError(
        "Could not reach the AlgoViz backend. Is it running? (" +
          (err.message || err) +
          ")"
      );
    } finally {
      setAiLoading(false);
    }
  }

  const intervalRef = useRef(null);

  // =========================
  // SNAPSHOT ENGINE
  // =========================

  const rawState = getStateAt(steps, current) || {};

  const state = {
    variables: rawState.variables || {},
    errors: rawState.errors || [],
    callStack: rawState.callStack || [],

    arrays: rawState.arrays || {},
    stacks: rawState.stacks || {},
    queues: rawState.queues || {},

    list: rawState.list || {
      nodes: {},
      head: null
    },

    tree: rawState.tree || {
      nodes: {},
      root: null
    },
    graph: rawState.graph || {
      nodes: {},
      edges: []
    },
    pointers: rawState.pointers || {},

    highlights: rawState.highlights || {
      compare: [],
      swap: [],
      visit: [],
      active: []
    },
    matrix: rawState.matrix || {},
    hashMap: rawState.hashMap || {},
    hashSet: rawState.hashSet || {}
  };

  // currentLine is tracked directly by stateEngine (state.currentLine),
  // reflecting the DSL source line of the most recently applied event.
  const currentLine = rawState.currentLine ?? null;

  const currentEvent = steps[current];

  // =========================
  // "IN USE" CHECKS
  // Each structure only gains a key/value once a CREATE-type event
  // for it has fired (see stateEngine.jsx), so emptiness here reliably
  // means "doesn't exist yet in this run" rather than "exists but empty".
  // =========================
  const hasVariables = Object.keys(state.variables).length > 0;
  const hasCallStack = state.callStack.length > 0;
  const hasErrors = state.errors.length > 0;

  const hasArrays = Object.keys(state.arrays).length > 0;
  const hasStacks = Object.keys(state.stacks).length > 0;
  const hasQueues = Object.keys(state.queues).length > 0;
  const hasMatrix = Object.keys(state.matrix).length > 0;
  const hasHashMap = Object.keys(state.hashMap).length > 0;
  const hasHashSet = Object.keys(state.hashSet).length > 0;

  const hasList = !!state.list.head || Object.keys(state.list.nodes || {}).length > 0;
  const hasTree = !!state.tree.root || Object.keys(state.tree.nodes || {}).length > 0;
  const hasGraph = Object.keys(state.graph.nodes || {}).length > 0;

  // =========================
  // GENERATE DSL → EVENTS
  // =========================
  function generateVisualization() {
    const events = replayExecution(code);

    setSteps(events);
    setCurrent(0);
  }

  // =========================
  // PLAYBACK ENGINE
  // =========================
  useEffect(() => {
    if (!playing) return;

    intervalRef.current = setInterval(() => {
      setCurrent((prev) => {
        if (prev >= steps.length - 1) {
          setPlaying(false);
          return prev;
        }

        return prev + 1;
      });
    }, speed);

    return () => clearInterval(intervalRef.current);
  }, [playing, speed, steps]);

  // =========================
  // CONTROLS
  // =========================
  const play = () => steps.length && setPlaying(true);
  const pause = () => setPlaying(false);
  const reset = () => {
    setPlaying(false);
    setCurrent(0);
  };

  const next = () =>
    setCurrent((prev) =>
      Math.min(prev + 1, steps.length - 1)
    );

  const prev = () =>
    setCurrent((prev) =>
      Math.max(prev - 1, 0)
    );

  // =========================
  // LINE NUMBER GUTTER (for the DSL Input editor)
  // Keeps the gutter scroll position synced with the textarea.
  // =========================
  const gutterRef = useRef(null);
  const textareaRef = useRef(null);
  const codeLines = code.split("\n");

  const handleEditorScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="app">
      <h1 className="title">AlgoViz</h1>

      {/* LEFT COLUMN: input + DSL panels, RIGHT: visualizer happens below */}
      <div className="editor-section">
        <div className="panel">
          {/* TABS — switches which editor is shown below, inside the same panel */}
          <div className="tab-row">
            <button
              className={"tab" + (inputMode === "dsl" ? " tab--active" : "")}
              onClick={() => setInputMode("dsl")}
            >
              DSL
            </button>
            <button
              className={"tab" + (inputMode === "java" ? " tab--active" : "")}
              onClick={() => setInputMode("java")}
            >
              Java
            </button>
          </div>

          {inputMode === "dsl" && (
            <div className="editor-wrap">
              <div className="line-gutter" ref={gutterRef}>
                {codeLines.map((_, idx) => (
                  <div
                    key={idx}
                    className={
                      "line-number" +
                      (currentLine === idx ? " line-number--active" : "")
                    }
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className="editor"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleEditorScroll}
                spellCheck={false}
              />
            </div>
          )}

          {inputMode === "java" && (
            <>
              <textarea
                className="editor editor--java"
                value={javaCode}
                onChange={(e) => setJavaCode(e.target.value)}
                spellCheck={false}
              />
              <button
                className="convert-btn"
                onClick={convertJavaAndVisualize}
                disabled={aiLoading}
              >
                {aiLoading ? "Running your code…" : "Convert & Visualize"}
              </button>

              <p className="hint-text">
                Compiled and run for real — not guessed. Supports arrays,
                pointers, stacks, queues, variables, simple recursion.
              </p>

              {aiError && <p className="feedback-text feedback-text--error">{aiError}</p>}
              {aiNote && <p className="feedback-text feedback-text--note">{aiNote}</p>}
            </>
          )}
        </div>

        {/* DSL OUTPUT — shows what the Java was actually traced to */}
        <div className="panel">
          <h3>Generated DSL</h3>
          <div className={"dsl-box" + (!generatedDsl ? " dsl-box--empty" : "")}>
            {generatedDsl ? (
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {generatedDsl}
              </pre>
            ) : (
              <span className="dsl-placeholder">
                DSL output will appear here after converting Java code.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="controls">
        <button onClick={generateVisualization}>
          Visualize
        </button>

        <button onClick={prev} disabled={current === 0}>
          Prev
        </button>

        {!playing ? (
          <button onClick={play}>Play</button>
        ) : (
          <button onClick={pause}>Pause</button>
        )}

        <button
          onClick={next}
          disabled={current >= steps.length - 1}
        >
          Next
        </button>

        <button onClick={reset}>Reset</button>

        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        >
          <option value={1000}>0.5x</option>
          <option value={500}>1x</option>
          <option value={250}>2x</option>
          <option value={100}>5x</option>
        </select>
      </div>

      {/* STATUS */}
      <div className="status">
        <p>
          Step {steps.length ? current + 1 : 0} / {steps.length}
        </p>

        <p>
          {currentEvent
            ? getMessage(currentEvent)
            : "Ready"}
        </p>
      </div>

      {/* VISUALIZER — only structures currently in use are rendered */}
      <div className="visualizer">
        {hasErrors && <ErrorPanel errors={state.errors} />}

        {hasVariables && (
          <VariablesDisplay variables={state.variables} />
        )}

        {hasCallStack && (
          <CallStackDisplay stack={state.callStack} />
        )}

        {hasArrays && (
          <ArrayDisplay
            arrays={state.arrays}
            pointers={state.pointers}
            highlights={state.highlights}
          />
        )}

        {hasStacks && <StackDisplay stacks={state.stacks} />}

        {hasQueues && <QueueDisplay queues={state.queues} />}

        {hasMatrix &&
          Object.entries(state.matrix).map(([name, matrix]) => (
            <MatrixDisplay
              key={name}
              name={name}
              matrix={matrix}
              pointers={state.pointers}
            />
          ))}

        {hasHashMap && <HashMapDisplay maps={state.hashMap} />}

        {hasHashSet && <HashSetDisplay sets={state.hashSet} />}

        {hasList && (
          <LinkedListDisplay list={state.list} pointers={state.pointers} />
        )}

        {hasTree && (
          <TreeDisplay tree={state.tree} highlights={state.highlights} />
        )}

        {hasGraph && <GraphDisplay graph={state.graph} />}

        {!hasErrors &&
          !hasVariables &&
          !hasCallStack &&
          !hasArrays &&
          !hasStacks &&
          !hasQueues &&
          !hasMatrix &&
          !hasHashMap &&
          !hasHashSet &&
          !hasList &&
          !hasTree &&
          !hasGraph && (
            <p className="visualizer-empty">
              Nothing to show yet — click Visualize to run the DSL.
            </p>
          )}
      </div>
    </div>
  );
}