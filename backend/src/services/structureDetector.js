/**
 * Lightweight, cheap pattern detection on raw Java source — NOT another LLM
 * call. This just scans for keywords/syntax that strongly suggest a given
 * data structure is present, so we can send a focused instrumentation
 * prompt instead of the always-everything version.
 *
 * False positives are fine and cheap (worst case: one extra section gets
 * included that wasn't needed). False negatives are the real risk (a
 * needed section gets left out) — so each detector below is intentionally
 * generous/broad rather than narrow.
 */
export function detectStructures(javaCode) {
  const code = javaCode;

  const hasArrays =
    /\bint\s*\[\s*\]/.test(code) || // int[] declarations
    /\[\s*\d/.test(code); // array literal/access like arr[0] or {1,2,3}

  const hasStackQueue =
    /\bStack\s*<|\bnew\s+Stack\s*\(/.test(code) ||
    /\bQueue\s*<|\bnew\s+(LinkedList|ArrayDeque)\s*\(/.test(code) ||
    /\.push\s*\(|\.pop\s*\(|\.poll\s*\(|\.offer\s*\(/.test(code);

  const hasRecursion = detectRecursion(code);

  const hasGraph =
    /\bMap\s*<\s*Integer\s*,\s*List\s*<\s*Integer\s*>\s*>/.test(code) ||
    /adjacenc/i.test(code) ||
    /\bgraph\b/i.test(code) ||
    /\bbfs\b/i.test(code) ||
    /\bdfs\b/i.test(code) ||
    (/\bMap\s*</.test(code) && /\bList\s*</.test(code) && /\.get\s*\(/.test(code));

  const hasTree =
    /\bTreeNode\b/.test(code) ||
    /\bNode\b/.test(code) ||
    /\bclass\s+\w*Node\b/.test(code) ||
    /\.left\b|\.right\b/.test(code) ||
    /\bBST\b/i.test(code) ||
    /\binorder\b|\bpreorder\b|\bpostorder\b/i.test(code);

  const hasList =
    /\bListNode\b/.test(code) ||
    /\.next\b/.test(code) ||
    (/\bclass\s+\w*Node\b/.test(code) && /\.next\s*=/.test(code));

  const hasMapSet =
    /\bHashMap\s*</.test(code) ||
    /\bHashSet\s*</.test(code) ||
    /\bnew\s+HashMap\s*\(/.test(code) ||
    /\bnew\s+HashSet\s*\(/.test(code) ||
    /\.put\s*\(|\.getOrDefault\s*\(/.test(code);

  const hasMatrix =
    /\bint\s*\[\s*\]\s*\[\s*\]/.test(code) || // int[][] declarations
    /new\s+int\s*\[[^\]]*\]\s*\[[^\]]*\]/.test(code); // new int[r][c]

  const hasIfElse = /\belse\b/.test(code);

  // hasBranch is intentionally NOT independent — if/else appears in nearly
  // all Java code, so detecting it on its own would defeat the purpose of
  // focused prompts (it would always be true). Only include the branch
  // section when the code both has if/else AND at least one other
  // structure was detected — branch visualization is meant to highlight
  // the core decision point of an algorithm, not to fire on every program.
  const hasOtherStructure =
    hasArrays ||
    hasStackQueue ||
    hasRecursion ||
    hasGraph ||
    hasTree ||
    hasList ||
    hasMapSet ||
    hasMatrix;

  const hasBranch = hasIfElse && hasOtherStructure;

  return {
    hasArrays,
    hasStackQueue,
    hasRecursion,
    hasGraph,
    hasTree,
    hasList,
    hasMapSet,
    hasMatrix,
    hasBranch,
  };
}

/**
 * Detects recursion by finding method definitions and checking whether the
 * method's own name appears again inside its body (a method calling itself).
 * This is a heuristic, not a real parser — good enough for catching the
 * common single-recursive-call student patterns this tool targets.
 */
function detectRecursion(code) {
  // Match "returnType methodName(args) {" style declarations
  const methodDeclRegex =
    /(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\([^)]*\)\s*\{/g;

  let match;
  const methodNames = [];
  while ((match = methodDeclRegex.exec(code)) !== null) {
    methodNames.push({ name: match[1], start: match.index });
  }

  for (let i = 0; i < methodNames.length; i++) {
    const { name, start } = methodNames[i];
    // Find this method's approximate body by matching braces from `start`.
    const bodyStart = code.indexOf("{", start);
    if (bodyStart === -1) continue;
    const body = extractBalancedBody(code, bodyStart);
    if (!body) continue;

    // Look for a call to the same method name inside its own body, e.g. "factorial("
    const selfCallRegex = new RegExp(`\\b${escapeRegex(name)}\\s*\\(`, "g");
    const occurrences = (body.match(selfCallRegex) || []).length;
    if (occurrences > 0) {
      return true;
    }
  }

  return false;
}

/** Extracts the substring from an opening brace to its matching closing brace. */
function extractBalancedBody(code, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < code.length; i++) {
    if (code[i] === "{") depth++;
    if (code[i] === "}") {
      depth--;
      if (depth === 0) {
        return code.slice(openBraceIndex + 1, i);
      }
    }
  }
  return null;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}