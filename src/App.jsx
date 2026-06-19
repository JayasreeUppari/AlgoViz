import { useState, useEffect, useRef } from "react";
import { replayExecution } from "./core/replayEngine";
import { getStateAt, getMessage } from "./core/stateEngine";

import ArrayDisplay from "./components/visualizers/ArrayDisplay";
import StackDisplay from "./components/visualizers/StackDisplay";
import QueueDisplay from "./components/visualizers/QueueDisplay";
import LinkedListDisplay from "./components/visualizers/LinkedListDisplay";
import VariablesDisplay from "./components/visualizers/VariablesDisplay";
import CallStackDisplay from "./components/visualizers/CallStackDisplay";
import "./styles/App.css";

export default function App() {
  const [code, setCode] = useState(`ARRAY [5,3,8]

`);

  const [steps, setSteps] = useState([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [loading, setLoading] = useState(false);

  const intervalRef = useRef(null);

  // =========================
  // SNAPSHOT ENGINE
  // =========================
  console.log("steps =", steps);
  console.log("current =", current);
  const rawState = getStateAt(steps, current) || {};

  const state = {
    variables: rawState.variables || {},
    callStack: rawState.callStack || [],

    array: rawState.array || [],
    stack: rawState.stack || [],
    queue: rawState.queue || [],

    list: rawState.list || { nodes: {} },

    pointers: rawState.pointers || {},

    highlights: rawState.highlights || {
      compare: [],
      swap: [],
      visit: [],
      active: []
    }
  };

  const currentEvent = steps[current];

  // =========================
  // GENERATE DSL → EVENTS
  // =========================
  function generateVisualization() {
    const events = replayExecution(code);

    console.log(events);

    setSteps(events);
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
    setCurrent((p) => Math.min(p + 1, steps.length - 1));

  const prev = () =>
    setCurrent((p) => Math.max(p - 1, 0));
  { console.log(state.variables) }
  // =========================
  // UI
  // =========================
  return (
    <div className="app">

      <h1 className="title">AlgoViz</h1>

      {/* INPUT */}
      <div className="editor-section">
        <div className="panel">
          <h3>DSL Input</h3>
          <textarea
            className="editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
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
      {loading && (
        <p>Generating visualization...</p>
      )}

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

      {/* VISUALIZER */}
      <div className="visualizer">

        <h3>Variables</h3>
        <VariablesDisplay variables={state.variables} />

        <h3>Call Stack</h3>
        <CallStackDisplay stack={state.callStack} />
        <h3>Array</h3>
        <ArrayDisplay
          array={state.array}
          pointers={state.pointers}
          highlights={state.highlights}
        />

        <h3>Stack</h3>
        <StackDisplay stack={state.stack} />

        <h3>Queue</h3>
        <QueueDisplay queue={state.queue} />

        <h3>Linked List</h3>
        <LinkedListDisplay
          list={state.list}
          pointers={state.pointers}
        />

      </div>
    </div>
  );
}