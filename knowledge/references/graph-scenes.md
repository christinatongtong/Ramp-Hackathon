# Graph scenes

Use when `structure.type` is `graph`.

- Nodes and directed edges have stable IDs.
- Use DFS colors / indegree overlays rather than inventing coordinates.
- Events: `init`, `node_visit`, `edge_examine`, `node_enqueue`, `indegree_update`,
  `node_finalize`, `cycle_detected`, `done`.
- Entity primitive: `graph_node`. Effect hint: `cycle_pulse`.
