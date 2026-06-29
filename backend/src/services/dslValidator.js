/**
 * Structural validator for AlgoViz DSL lines.
 *
 * This checks SYNTAX/STRUCTURE only — exactly matching what
 * src/core/replayEngine.js actually parses:
 *   - is the command name recognized
 *   - does it have the right number of arguments
 *   - are referenced names (pointer/array/stack/queue) declared before use
 *
 * It does NOT check whether the trace is behaviorally correct — with Option C
 * (real compile + run), behavioral correctness is already guaranteed by the
 * JVM itself. This validator exists to catch INSTRUMENTATION bugs: e.g. the
 * LLM emitted Trace.move("left", ...) but never called Trace.pointerCreate
 * for "left" first, which would be a malformed sequence even though each
 * individual line is syntactically fine.
 */

const ARITY = {
  DECLARE: 2, // DECLARE name value
  SET: 2, // SET name value
  ARRAY_SET: 3, // ARRAY_SET name index value
  ARRAY_SWAP: 3, // ARRAY_SWAP name i j
  COMPARE: 3, // COMPARE name i j
  MOVE: 3, // MOVE pointer array index
  STACK_PUSH: 2,
  STACK_POP: 1,
  QUEUE_ENQUEUE: 2,
  QUEUE_DEQUEUE: 1,
  RETURN: 0,
  GRAPH_NODE: 2, // GRAPH_NODE id value
  GRAPH_VISIT: 1, // GRAPH_VISIT id
  GRAPH_HIGHLIGHT_EDGE: 2, // GRAPH_HIGHLIGHT_EDGE from to
  TREE_NODE: 2, // TREE_NODE id value
  TREE_VISIT: 1, // TREE_VISIT id
  LIST_CREATE: 2, // LIST_CREATE id value
  LIST_LINK: 2, // LIST_LINK from to
  LIST_HEAD: 1, // LIST_HEAD id
  LIST_POINTER: 2, // LIST_POINTER name position
  MAP_PUT: 3, // MAP_PUT map key value
  MAP_REMOVE: 2, // MAP_REMOVE map key
  SET_ADD: 2, // SET_ADD set value
  SET_REMOVE: 2, // SET_REMOVE set value
  MATRIX_SET: 4, // MATRIX_SET name row col value
  MATRIX_GET: 3, // MATRIX_GET name row col
  MATRIX_HIGHLIGHT: 3, // MATRIX_HIGHLIGHT name row col
  MATRIX_UNHIGHLIGHT: 1, // MATRIX_UNHIGHLIGHT name
};

function isInt(token) {
  return token !== undefined && /^-?\d+$/.test(token);
}

/**
 * Validates a full block of DSL text.
 * Returns { ok: true } or { ok: false, errors: [{ line, message }] }
 */
export function validateDSL(dslText) {
  const lines = dslText.split("\n");
  const errors = [];

  const declaredArrays = new Set();
  const declaredPointers = new Set();
  const declaredStacks = new Set();
  const declaredQueues = new Set();
  const declaredGraphNodes = new Set();
  let graphStarted = false;
  const declaredTreeNodes = new Set();
  let treeRootSet = false;
  const declaredListNodes = new Set();
  const declaredMaps = new Set();
  const declaredSets = new Set();
  const declaredMatrices = new Set();
  const branchStack = [];
  const callStackDepth = [];

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    const lineNo = idx + 1;
    if (!line) return;

    const tokens = line.split(/\s+/);
    const cmd = tokens[0];

    // ARRAY name [v,v,v] — variable arity, handled separately
    if (cmd === "ARRAY") {
      const match = line.match(/^ARRAY\s+(\w+)\s+\[(.*)\]$/);
      if (!match) {
        errors.push({ line: lineNo, message: `Malformed ARRAY line: "${line}"` });
        return;
      }
      declaredArrays.add(match[1]);
      return;
    }

    if (cmd === "POINTER") {
      // POINTER name array index
      const [, name, arrayName, index] = tokens;
      if (!name || !arrayName || !isInt(index)) {
        errors.push({ line: lineNo, message: `Malformed POINTER line: "${line}"` });
        return;
      }
      if (!declaredArrays.has(arrayName)) {
        errors.push({
          line: lineNo,
          message: `POINTER "${name}" references undeclared array "${arrayName}"`,
        });
      }
      declaredPointers.add(name);
      return;
    }

    if (cmd === "STACK") {
      const name = tokens[1];
      if (!name) {
        errors.push({ line: lineNo, message: `Malformed STACK line: "${line}"` });
        return;
      }
      declaredStacks.add(name);
      return;
    }

    if (cmd === "QUEUE") {
      const name = tokens[1];
      if (!name) {
        errors.push({ line: lineNo, message: `Malformed QUEUE line: "${line}"` });
        return;
      }
      declaredQueues.add(name);
      return;
    }

    if (cmd === "HASHMAP") {
      const name = tokens[1];
      if (!name) {
        errors.push({ line: lineNo, message: `Malformed HASHMAP line: "${line}"` });
        return;
      }
      declaredMaps.add(name);
      return;
    }

    if (cmd === "HASHSET") {
      const name = tokens[1];
      if (!name) {
        errors.push({ line: lineNo, message: `Malformed HASHSET line: "${line}"` });
        return;
      }
      declaredSets.add(name);
      return;
    }

    if (cmd === "MATRIX_CREATE") {
      // MATRIX_CREATE name rows cols
      const [, name, rows, cols] = tokens;
      if (!name || !isInt(rows) || !isInt(cols)) {
        errors.push({ line: lineNo, message: `Malformed MATRIX_CREATE line: "${line}"` });
        return;
      }
      declaredMatrices.add(name);
      return;
    }

    if (cmd === "GRAPH_START") {
      graphStarted = true;
      return;
    }

    if (cmd === "GRAPH_CONNECT") {
      // GRAPH_CONNECT from to weight directed
      const [, from, to, weight, directed] = tokens;
      if (!from || !to || weight === undefined || directed === undefined) {
        errors.push({ line: lineNo, message: `Malformed GRAPH_CONNECT line: "${line}"` });
        return;
      }
      if (weight !== "null" && !isInt(weight)) {
        errors.push({
          line: lineNo,
          message: `GRAPH_CONNECT weight must be an integer or "null", got "${weight}"`,
        });
      }
      if (directed !== "true" && directed !== "false") {
        errors.push({
          line: lineNo,
          message: `GRAPH_CONNECT directed flag must be "true" or "false", got "${directed}"`,
        });
      }
      if (!graphStarted) {
        errors.push({ line: lineNo, message: `GRAPH_CONNECT used before GRAPH_START` });
      }
      if (!declaredGraphNodes.has(from)) {
        errors.push({ line: lineNo, message: `GRAPH_CONNECT references undeclared node "${from}"` });
      }
      if (!declaredGraphNodes.has(to)) {
        errors.push({ line: lineNo, message: `GRAPH_CONNECT references undeclared node "${to}"` });
      }
      return;
    }

    if (cmd === "TREE_ROOT") {
      const id = tokens[1];
      if (!id) {
        errors.push({ line: lineNo, message: `Malformed TREE_ROOT line: "${line}"` });
        return;
      }
      if (!declaredTreeNodes.has(id)) {
        errors.push({ line: lineNo, message: `TREE_ROOT references undeclared node "${id}"` });
      }
      treeRootSet = true;
      return;
    }

    if (cmd === "TREE_CONNECT") {
      // TREE_CONNECT parent child side
      const [, parent, child, side] = tokens;
      if (!parent || !child || !side) {
        errors.push({ line: lineNo, message: `Malformed TREE_CONNECT line: "${line}"` });
        return;
      }
      if (side !== "left" && side !== "right") {
        errors.push({
          line: lineNo,
          message: `TREE_CONNECT side must be "left" or "right", got "${side}"`,
        });
      }
      if (!declaredTreeNodes.has(parent)) {
        errors.push({ line: lineNo, message: `TREE_CONNECT references undeclared parent node "${parent}"` });
      }
      if (!declaredTreeNodes.has(child)) {
        errors.push({ line: lineNo, message: `TREE_CONNECT references undeclared child node "${child}"` });
      }
      return;
    }

    if (cmd === "CALL") {
      // CALL functionName key=value key=value...
      const functionName = tokens[1];
      if (!functionName) {
        errors.push({ line: lineNo, message: `Malformed CALL line: "${line}"` });
        return;
      }
      callStackDepth.push(functionName);
      return;
    }

    if (cmd === "RETURN") {
      if (line !== "RETURN") {
        errors.push({
          line: lineNo,
          message: `RETURN must appear alone with no extra text (got: "${line}")`,
        });
        return;
      }
      if (callStackDepth.length === 0) {
        errors.push({
          line: lineNo,
          message: `RETURN with no matching CALL on the stack`,
        });
        return;
      }
      callStackDepth.pop();
      return;
    }

    if (cmd === "ENTER_IF" || cmd === "EXIT_IF" || cmd === "ENTER_ELSE" || cmd === "EXIT_ELSE") {
      if (line !== cmd) {
        errors.push({
          line: lineNo,
          message: `${cmd} must appear alone with no extra text (got: "${line}")`,
        });
        return;
      }
      if (cmd === "ENTER_IF") {
        branchStack.push("IF");
      } else if (cmd === "EXIT_IF") {
        if (branchStack[branchStack.length - 1] !== "IF") {
          errors.push({ line: lineNo, message: `EXIT_IF with no matching ENTER_IF` });
        } else {
          branchStack.pop();
        }
      } else if (cmd === "ENTER_ELSE") {
        branchStack.push("ELSE");
      } else if (cmd === "EXIT_ELSE") {
        if (branchStack[branchStack.length - 1] !== "ELSE") {
          errors.push({ line: lineNo, message: `EXIT_ELSE with no matching ENTER_ELSE` });
        } else {
          branchStack.pop();
        }
      }
      return;
    }

    // Fixed-arity commands
    if (cmd in ARITY) {
      const expectedArgs = ARITY[cmd];
      const actualArgs = tokens.length - 1;
      if (actualArgs !== expectedArgs) {
        errors.push({
          line: lineNo,
          message: `${cmd} expects ${expectedArgs} argument(s), got ${actualArgs}: "${line}"`,
        });
        return;
      }

      // Reference checks
      if (cmd === "ARRAY_SET" || cmd === "ARRAY_SWAP" || cmd === "COMPARE") {
        const arrayName = tokens[1];
        if (!declaredArrays.has(arrayName)) {
          errors.push({
            line: lineNo,
            message: `${cmd} references undeclared array "${arrayName}"`,
          });
        }
      }
      if (cmd === "MOVE") {
        const [, pointerName, arrayName] = tokens;
        if (!declaredPointers.has(pointerName)) {
          errors.push({
            line: lineNo,
            message: `MOVE references undeclared pointer "${pointerName}"`,
          });
        }
        if (!declaredArrays.has(arrayName)) {
          errors.push({
            line: lineNo,
            message: `MOVE references undeclared array "${arrayName}"`,
          });
        }
      }
      if (cmd === "STACK_PUSH" || cmd === "STACK_POP") {
        const stackName = tokens[1];
        if (!declaredStacks.has(stackName)) {
          errors.push({
            line: lineNo,
            message: `${cmd} references undeclared stack "${stackName}"`,
          });
        }
      }
      if (cmd === "QUEUE_ENQUEUE" || cmd === "QUEUE_DEQUEUE") {
        const queueName = tokens[1];
        if (!declaredQueues.has(queueName)) {
          errors.push({
            line: lineNo,
            message: `${cmd} references undeclared queue "${queueName}"`,
          });
        }
      }
      if (cmd === "GRAPH_NODE") {
        const id = tokens[1];
        if (!isInt(tokens[2])) {
          errors.push({
            line: lineNo,
            message: `GRAPH_NODE value must be an integer, got "${tokens[2]}"`,
          });
        }
        if (!graphStarted) {
          errors.push({ line: lineNo, message: `GRAPH_NODE used before GRAPH_START` });
        }
        declaredGraphNodes.add(id);
      }
      if (cmd === "GRAPH_VISIT") {
        const id = tokens[1];
        if (!declaredGraphNodes.has(id)) {
          errors.push({
            line: lineNo,
            message: `GRAPH_VISIT references undeclared node "${id}"`,
          });
        }
      }
      if (cmd === "GRAPH_HIGHLIGHT_EDGE") {
        const [, from, to] = tokens;
        if (!declaredGraphNodes.has(from)) {
          errors.push({
            line: lineNo,
            message: `GRAPH_HIGHLIGHT_EDGE references undeclared node "${from}"`,
          });
        }
        if (!declaredGraphNodes.has(to)) {
          errors.push({
            line: lineNo,
            message: `GRAPH_HIGHLIGHT_EDGE references undeclared node "${to}"`,
          });
        }
      }
      if (cmd === "TREE_NODE") {
        const id = tokens[1];
        if (!isInt(tokens[2])) {
          errors.push({
            line: lineNo,
            message: `TREE_NODE value must be an integer, got "${tokens[2]}"`,
          });
        }
        if (declaredTreeNodes.has(id)) {
          errors.push({
            line: lineNo,
            message: `TREE_NODE "${id}" declared more than once`,
          });
        }
        declaredTreeNodes.add(id);
      }
      if (cmd === "TREE_VISIT") {
        const id = tokens[1];
        if (!declaredTreeNodes.has(id)) {
          errors.push({
            line: lineNo,
            message: `TREE_VISIT references undeclared node "${id}"`,
          });
        }
        if (!treeRootSet) {
          errors.push({
            line: lineNo,
            message: `TREE_VISIT used before TREE_ROOT was set`,
          });
        }
      }
      if (cmd === "LIST_CREATE") {
        const id = tokens[1];
        if (!isInt(tokens[2])) {
          errors.push({
            line: lineNo,
            message: `LIST_CREATE value must be an integer, got "${tokens[2]}"`,
          });
        }
        if (declaredListNodes.has(id)) {
          errors.push({
            line: lineNo,
            message: `LIST_CREATE "${id}" declared more than once`,
          });
        }
        declaredListNodes.add(id);
      }
      if (cmd === "LIST_LINK") {
        const [, from, to] = tokens;
        if (!declaredListNodes.has(from)) {
          errors.push({
            line: lineNo,
            message: `LIST_LINK references undeclared node "${from}"`,
          });
        }
        if (!declaredListNodes.has(to)) {
          errors.push({
            line: lineNo,
            message: `LIST_LINK references undeclared node "${to}"`,
          });
        }
      }
      if (cmd === "LIST_HEAD") {
        const id = tokens[1];
        if (!declaredListNodes.has(id)) {
          errors.push({
            line: lineNo,
            message: `LIST_HEAD references undeclared node "${id}"`,
          });
        }
      }
      if (cmd === "LIST_POINTER") {
        const position = tokens[2];
        if (!declaredListNodes.has(position)) {
          errors.push({
            line: lineNo,
            message: `LIST_POINTER references undeclared node "${position}"`,
          });
        }
      }
      if (cmd === "MAP_PUT" || cmd === "MAP_REMOVE") {
        const mapName = tokens[1];
        if (!declaredMaps.has(mapName)) {
          errors.push({
            line: lineNo,
            message: `${cmd} references undeclared map "${mapName}"`,
          });
        }
      }
      if (cmd === "MAP_PUT") {
        const value = tokens[3];
        if (!isInt(value)) {
          errors.push({
            line: lineNo,
            message: `MAP_PUT value must be an integer, got "${value}"`,
          });
        }
      }
      if (cmd === "SET_ADD" || cmd === "SET_REMOVE") {
        const setName = tokens[1];
        if (!declaredSets.has(setName)) {
          errors.push({
            line: lineNo,
            message: `${cmd} references undeclared set "${setName}"`,
          });
        }
        if (!isInt(tokens[2])) {
          errors.push({
            line: lineNo,
            message: `${cmd} value must be an integer, got "${tokens[2]}"`,
          });
        }
      }
      if (
        cmd === "MATRIX_SET" ||
        cmd === "MATRIX_GET" ||
        cmd === "MATRIX_HIGHLIGHT" ||
        cmd === "MATRIX_UNHIGHLIGHT"
      ) {
        const matrixName = tokens[1];
        if (!declaredMatrices.has(matrixName)) {
          errors.push({
            line: lineNo,
            message: `${cmd} references undeclared matrix "${matrixName}"`,
          });
        }
      }
      if (cmd === "MATRIX_SET") {
        const value = tokens[4];
        if (!isInt(value)) {
          errors.push({
            line: lineNo,
            message: `MATRIX_SET value must be an integer, got "${value}"`,
          });
        }
      }

      return;
    }

    errors.push({ line: lineNo, message: `Unrecognized command: "${cmd}"` });
  });

  if (callStackDepth.length > 0) {
    errors.push({
      line: lines.length,
      message: `${callStackDepth.length} CALL(s) never matched with a RETURN: ${callStackDepth.join(", ")}`,
    });
  }

  if (branchStack.length > 0) {
    errors.push({
      line: lines.length,
      message: `${branchStack.length} branch marker(s) never closed: ${branchStack.join(", ")}`,
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}

/** Formats validation errors into a single string suitable for LLM retry feedback. */
export function formatErrorsForRetry(errors) {
  return errors.map((e) => `Line ${e.line}: ${e.message}`).join("\n");
}