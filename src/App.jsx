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

      {/* LEFT COLUMN: input + future-DSL panels, RIGHT: visualizer happens below */}
      <div className="editor-section">
        {/* INPUT (with line-number gutter) */}
        <div className="panel">
          <h3>DSL Input</h3>
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
        </div>

        {/* DSL (placeholder — will show compiled DSL from Java input in the future) */}
        <div className="panel">
          <h3>DSL</h3>
          <div className="dsl-box dsl-box--empty">
            <span className="dsl-placeholder">
              DSL output will appear here once Java → DSL compilation is wired up.
            </span>
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
