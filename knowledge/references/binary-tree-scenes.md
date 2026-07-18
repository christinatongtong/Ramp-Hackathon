# Binary-tree scenes

Use when `structure.type` is `binary_tree`.

- Nodes have stable IDs (`n0`, `n1`, …) with `left` / `right` child IDs or null.
- `child_swap` exchanges left/right without moving node IDs.
- Prefer keeping layout computed from topology each step (layered tree).
- Events: `init`, `node_visit`, `child_swap`, `move_left`, `move_right`,
  `subtree_complete`, `done`.
- Entity primitive: `tree_node`. Effect hints: `child_swap_flash`, `subtree_glow`.
