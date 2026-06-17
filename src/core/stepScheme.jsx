export const createStep = ({
  // =========================
  // EXECUTION
  // =========================
  line = null,

  variables = {},

  callStack = [],

  // =========================
  // DATA STRUCTURES
  // =========================

  // Linear
  array = [],
  stack = [],
  queue = [],

  // Hashing
  hashMap = {},
  hashSet = [],

  // Node Based
  list = {
    nodes: {},
    head: null
  },

  tree = {
    nodes: [],
    edges: []
  },

  graph = {
    nodes: [],
    edges: []
  },

  // =========================
  // VISUALIZATION
  // =========================

  pointers = {},

  highlights = {
    compare: [],
    swap: [],
    visit: [],
    active: []
  },

  // =========================
  // UI / DEBUG
  // =========================

  action = "",
  message = "",

  // Optional
  metadata = {}
}) => ({
  line,

  variables,

  callStack,

  array,
  stack,
  queue,

  hashMap,
  hashSet,

  list,
  tree,
  graph,

  pointers,

  highlights,

  action,
  message,

  metadata
});