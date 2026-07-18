# Structure selection

Choose `structure.type` from the capability manifest's `sceneTypes`. Structure
describes the **topology of the algorithm's data**, not decoration.

## Decision guide

| Structure | Use when | Typical input |
|-----------|----------|---------------|
| `grid` | 2D cells, islands, matrices, mazes, flood fill, multi-source BFS | `grid` / `heights` |
| `array` | 1D sequences, two pointers, sliding window, binary search, in-place sorts | `nums` / `arr` / `numbers` |
| `linked_list` | `head` / `ListNode`, ordering by `next`, rewiring links or moving node pointers | `head` |
| `binary_tree` | `root` / `TreeNode`, left/right children, structural swaps | `root` |
| `graph` | Directed/undirected edges, courses/prereqs, DFS colors, indegrees | `numCourses` + `prerequisites` |

## Choose `linked_list` when

- Input uses `head` / `ListNode`
- Ordering is represented by `next` references
- The algorithm rewires links or moves node pointers

Do **not** choose `linked_list` merely because the input is a sequence.
Use `array` when index-based access is central.

## Hard rules

1. **Match the trace.** If `init.structure` is `"linked_list"`, the plan MUST
   use `structure.type: "linked_list"`. Never contradict the verified init event.
2. **Separate theme.** Put artistic choices in `theme`.
3. **Layout coordinates are never generated.** Spacing is computed by the FE.
4. **Prefer the smallest structure that fits.**
5. **Theme presets are skins.** Prefer `generic_grid` for list/tree/graph unless
   a themed backdrop still reads clearly.

## semanticSpec alignment

- `semanticSpec.sceneType` MUST equal `structure.type`
- `semanticSpec.inputKey` MUST match `structure.inputKey`
- Bind every observed scalar value (cell / element / node value / label)
