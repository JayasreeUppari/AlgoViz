import java.io.PrintStream;

/**
 * Trace.java
 *
 * This class is injected alongside the student's (LLM-instrumented) code.
 * Every method call here emits exactly one line of AlgoViz DSL.
 *
 * IMPORTANT DESIGN NOTE:
 * We write trace lines to a separate marker-prefixed stream on stdout
 * (not stderr) so they survive simple subprocess piping, but each line
 * is prefixed with "##ALGOVIZ##" so the harness can separate real DSL
 * output from anything the student's own code prints (e.g. System.out.println
 * calls left in their original program).
 *
 * Scope of this first pass (Phase: arrays / pointers / stack / queue / vars):
 *   - declare, set            -> DECLARE / SET
 *   - arrayCreate              -> ARRAY
 *   - arraySet                 -> ARRAY_SET
 *   - arraySwap                -> ARRAY_SWAP
 *   - compare                  -> COMPARE
 *   - pointerCreate, move      -> POINTER / MOVE
 *   - stackCreate/push/pop     -> STACK / STACK_PUSH / STACK_POP
 *   - queueCreate/enqueue/dequeue -> QUEUE / QUEUE_ENQUEUE / QUEUE_DEQUEUE
 *   - call, ret                -> CALL / RETURN   (stack frames; needed for recursion)
 *
 * Graph/tree/list/matrix/hashmap/hashset methods are intentionally NOT included
 * in this first pass — add them here, following the exact same pattern, once
 * arrays/stack/queue/recursion are confirmed working end to end.
 */
public final class Trace {

    private static final String PREFIX = "##ALGOVIZ##";
    private static final PrintStream OUT = System.out;

    private Trace() {}

    private static void emit(String line) {
        OUT.println(PREFIX + line);
    }

    // ---------------------------------------------------------------
    // VARIABLES
    // ---------------------------------------------------------------

    public static void declare(String name, int value) {
        emit("DECLARE " + name + " " + value);
    }

    public static void set(String name, int value) {
        emit("SET " + name + " " + value);
    }

    // ---------------------------------------------------------------
    // ARRAYS
    // ---------------------------------------------------------------

    /** Call once, right after the array is created/initialized. */
    public static void arrayCreate(String name, int[] values) {
        StringBuilder sb = new StringBuilder();
        sb.append("ARRAY ").append(name).append(" [");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(values[i]);
        }
        sb.append("]");
        emit(sb.toString());
    }

    public static void arraySet(String name, int index, int value) {
        emit("ARRAY_SET " + name + " " + index + " " + value);
    }

    public static void arraySwap(String name, int i, int j) {
        emit("ARRAY_SWAP " + name + " " + i + " " + j);
    }

    /** Logical compare of two indices in an array (does not mutate). */
    public static void compare(String name, int i, int j) {
        emit("COMPARE " + name + " " + i + " " + j);
    }

    // ---------------------------------------------------------------
    // POINTERS
    // ---------------------------------------------------------------

    public static void pointerCreate(String pointerName, String arrayName, int index) {
        emit("POINTER " + pointerName + " " + arrayName + " " + index);
    }

    public static void move(String pointerName, String arrayName, int index) {
        emit("MOVE " + pointerName + " " + arrayName + " " + index);
    }

    // ---------------------------------------------------------------
    // STACK
    // ---------------------------------------------------------------

    public static void stackCreate(String name) {
        emit("STACK " + name);
    }

    public static void stackPush(String name, int value) {
        emit("STACK_PUSH " + name + " " + value);
    }

    public static void stackPop(String name) {
        emit("STACK_POP " + name);
    }

    // ---------------------------------------------------------------
    // QUEUE
    // ---------------------------------------------------------------

    public static void queueCreate(String name) {
        emit("QUEUE " + name);
    }

    public static void queueEnqueue(String name, int value) {
        emit("QUEUE_ENQUEUE " + name + " " + value);
    }

    public static void queueDequeue(String name) {
        emit("QUEUE_DEQUEUE " + name);
    }

    // ---------------------------------------------------------------
    // CALL STACK / RECURSION
    // ---------------------------------------------------------------

    /**
     * Call at the START of a function/method whose execution you want
     * visualized as a call-stack frame (most importantly: recursive calls).
     *
     * args should be pre-formatted as "name=value" pairs, e.g.:
     *   Trace.call("factorial", "n=5");
     *   Trace.call("binarySearch", "low=0", "high=9", "target=7");
     */
    public static void call(String functionName, String... args) {
        StringBuilder sb = new StringBuilder();
        sb.append("CALL ").append(functionName);
        for (String a : args) {
            sb.append(" ").append(a);
        }
        emit(sb.toString());
    }

    /**
     * Call immediately before returning from a traced function.
     *
     * IMPORTANT: AlgoViz's replayEngine.js matches this line with an EXACT
     * string comparison (line === "RETURN") — no trailing text is allowed.
     * If you need to show a returned value, log it as a SET on a variable
     * BEFORE calling ret(), e.g.:
     *   Trace.set("result", value);
     *   Trace.ret();
     */
    public static void ret() {
        emit("RETURN");
    }

    // ---------------------------------------------------------------
    // GRAPH
    // ---------------------------------------------------------------
    // Scope of this pass: enough to visualize the standard student idiom
    // (adjacency list + BFS/DFS traversal) — start, node creation, edges,
    // visiting a node, and highlighting an edge being explored.
    //
    // replayEngine.js GRAPH_CONNECT format: GRAPH_CONNECT from to weight directed
    //   weight: a number, or the literal string "null" if unweighted
    //   directed: "true" or "false"

    /** Call once, before creating any graph nodes. */
    public static void graphStart() {
        emit("GRAPH_START");
    }

    /**
     * Call once per node, the first time it's introduced (e.g. the first
     * time a node id appears as a key in your adjacency list/map).
     * value is shown in the visualization; pass the node's own id again if
     * the node doesn't carry a separate value.
     */
    public static void graphNode(String id, int value) {
        emit("GRAPH_NODE " + id + " " + value);
    }

    /**
     * Call once per edge, when the edge is added to the graph (e.g. inside
     * the loop that builds your adjacency list from input).
     * weight: pass null for an unweighted graph.
     * directed: true if the edge only goes from->to, false if undirected.
     */
    public static void graphConnect(String from, String to, Integer weight, boolean directed) {
        String weightStr = (weight == null) ? "null" : String.valueOf(weight);
        emit("GRAPH_CONNECT " + from + " " + to + " " + weightStr + " " + directed);
    }

    /** Call right when a node is visited during traversal (e.g. when popped
     * off a BFS queue or when a DFS call first processes it). */
    public static void graphVisit(String id) {
        emit("GRAPH_VISIT " + id);
    }

    /** Call right when an edge is being examined/traversed (e.g. inside the
     * loop over a node's neighbors, for the neighbor currently being checked). */
    public static void graphHighlightEdge(String from, String to) {
        emit("GRAPH_HIGHLIGHT_EDGE " + from + " " + to);
    }

    // ---------------------------------------------------------------
    // TREE (binary tree / BST)
    // ---------------------------------------------------------------
    // Scope of this pass: enough to visualize the standard student idiom
    // (build a binary tree / BST, then traverse or search it) — node
    // creation, declaring the root, connecting parent->child as left/right,
    // and visiting a node during traversal.

    /**
     * Call once per node, the first time it's created (e.g. right when
     * `new TreeNode(value)` is constructed, or right when a value is
     * inserted into the BST as a brand-new node).
     * id should be a stable identifier for this node — using the node's
     * own value as a string (e.g. "10") works well for the common case
     * where a BST has no duplicate values.
     */
    public static void treeNode(String id, int value) {
        emit("TREE_NODE " + id + " " + value);
    }

    /** Call once, right after the root node is established. */
    public static void treeRoot(String id) {
        emit("TREE_ROOT " + id);
    }

    /**
     * Call once per parent-child link, right when that link is made
     * (e.g. right after node.left = newNode or node.right = newNode).
     * side must be exactly "left" or "right".
     */
    public static void treeConnect(String parentId, String childId, String side) {
        emit("TREE_CONNECT " + parentId + " " + childId + " " + side);
    }

    /** Call right when a node is visited during traversal or search
     * (e.g. inside the recursive call that processes that node, or when
     * the search/traversal logic currently points at this node). */
    public static void treeVisit(String id) {
        emit("TREE_VISIT " + id);
    }

    // ---------------------------------------------------------------
    // LINKED LIST
    // ---------------------------------------------------------------
    // Scope: enough to visualize building a singly-linked list and moving
    // a pointer/cursor through it (the standard student idiom).

    /** Call once per node, right when it's created (e.g. right when
     * `new ListNode(value)` is constructed). id should be a stable
     * identifier — using the node's own value as a string works for the
     * common case with no duplicate values. */
    public static void listCreate(String id, int value) {
        emit("LIST_CREATE " + id + " " + value);
    }

    /** Call once per link, right when one node's "next" pointer is set to
     * point at another node (e.g. right after `a.next = b`). */
    public static void listLink(String fromId, String toId) {
        emit("LIST_LINK " + fromId + " " + toId);
    }

    /** Call once, right after the head of the list is established. */
    public static void listHead(String id) {
        emit("LIST_HEAD " + id);
    }

    /** Call whenever a traversal pointer/cursor (e.g. `current`, `temp`,
     * `ptr`) moves to point at a different node. name is the pointer
     * variable's own name; position is the node id it now points to. */
    public static void listPointer(String name, String position) {
        emit("LIST_POINTER " + name + " " + position);
    }

    // ---------------------------------------------------------------
    // HASHMAP
    // ---------------------------------------------------------------

    /** Call once when a HashMap (or similar) is instantiated. */
    public static void hashMapCreate(String name) {
        emit("HASHMAP " + name);
    }

    /** Call right after .put(key, value) on that map. key/value are
     * formatted as strings; numeric values are fine passed as ints. */
    public static void mapPut(String mapName, String key, int value) {
        emit("MAP_PUT " + mapName + " " + key + " " + value);
    }

    /** Call right after .remove(key) on that map. */
    public static void mapRemove(String mapName, String key) {
        emit("MAP_REMOVE " + mapName + " " + key);
    }

    // ---------------------------------------------------------------
    // HASHSET
    // ---------------------------------------------------------------

    /** Call once when a HashSet (or similar) is instantiated. */
    public static void hashSetCreate(String name) {
        emit("HASHSET " + name);
    }

    /** Call right after .add(value) on that set. */
    public static void setAdd(String setName, int value) {
        emit("SET_ADD " + setName + " " + value);
    }

    /** Call right after .remove(value) on that set. */
    public static void setRemove(String setName, int value) {
        emit("SET_REMOVE " + setName + " " + value);
    }

    // ---------------------------------------------------------------
    // MATRIX (2D grid)
    // ---------------------------------------------------------------

    /** Call once, immediately after a 2D int array is created. */
    public static void matrixCreate(String name, int rows, int cols) {
        emit("MATRIX_CREATE " + name + " " + rows + " " + cols);
    }

    /** Call right after grid[row][col] = value is executed. */
    public static void matrixSet(String name, int row, int col, int value) {
        emit("MATRIX_SET " + name + " " + row + " " + col + " " + value);
    }

    /** Call right when a cell's value is read/inspected (e.g. inside a
     * comparison or condition that reads grid[row][col]). */
    public static void matrixGet(String name, int row, int col) {
        emit("MATRIX_GET " + name + " " + row + " " + col);
    }

    /** Call to highlight a cell currently being examined (e.g. inside a
     * traversal loop, for the cell currently being visited). */
    public static void matrixHighlight(String name, int row, int col) {
        emit("MATRIX_HIGHLIGHT " + name + " " + row + " " + col);
    }

    /** Call to clear the current highlight on a matrix. */
    public static void matrixUnhighlight(String name) {
        emit("MATRIX_UNHIGHLIGHT " + name);
    }

    // ---------------------------------------------------------------
    // BRANCH VISUALIZATION
    // ---------------------------------------------------------------
    // These four calls visualize which branch of an if/else a program
    // actually took at runtime. Each is a bare marker with no arguments —
    // AlgoViz's parser matches them with an EXACT string comparison, so
    // never put anything else on these lines.

    /** Call as the first line inside an if-block's body, right after the
     * condition evaluates true (i.e. you're now inside the if branch). */
    public static void enterIf() {
        emit("ENTER_IF");
    }

    /** Call as the last line inside an if-block's body, right before
     * control leaves that block (whether falling through or returning). */
    public static void exitIf() {
        emit("EXIT_IF");
    }

    /** Call as the first line inside an else-block's body. */
    public static void enterElse() {
        emit("ENTER_ELSE");
    }

    /** Call as the last line inside an else-block's body. */
    public static void exitElse() {
        emit("EXIT_ELSE");
    }
}