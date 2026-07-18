# Grid problem taxonomy

Classify the algorithm before choosing its art direction. The same binary grid can
represent very different concepts depending on the trace.

| Family | Core idea to reveal | Useful states/events | Good default world |
|---|---|---|---|
| Flood fill | One seed expands through a connected region | `visit`, `frontier_add`, `region_discovered` | `island` or `generic_grid` |
| Connected components | Repeated flood fills create separate groups | `level_start`, `visit`, `region_discovered` | `island` |
| Multi-source spread | Many sources advance in synchronized layers | `frontier_add`, `cell_update`, `level_start` | `farm` or `generic_grid` |
| Shortest path | Frontier expands until a goal, then path is revealed | `frontier_add`, `frontier_remove`, `path_mark` | `generic_grid` |
| Reachability | Searches mark cells reachable from one or more sources | `visit`, `reachability_update`, `path_mark` | `island` or `generic_grid` |
| Height/cost map | Numeric values constrain movement | `visit`, `reachability_update` | `island` or `generic_grid` |
| Boundary capture | Boundary-connected cells are protected; others change | `visit`, `region_discovered`, `cell_update` | `island` or `generic_grid` |
| Cellular simulation | The whole board changes over discrete rounds | `level_start`, `cell_update` | `farm` or `generic_grid` |
| Grid dynamic programming | Cells become finalized from prior neighbors | `visit`, `cell_update` | `generic_grid` |
| Backtracking/board search | Choices advance and may be undone | Only use if trace explicitly emits both writes | `generic_grid` |

## Algorithm invariants

Base explanations on an invariant supported by the trace:

- BFS: the frontier contains discovered cells waiting to be processed.
- Layered BFS: all cells in the current level share a distance/minute.
- DFS/flood fill: visited cells belong to the current connected exploration.
- Multi-source search: all initial sources begin at equal distance zero.
- Reverse reachability: traversal direction may reverse the story, but the trace
  still determines which cells are accepted.
- Shortest path: visited does not necessarily mean final path; reveal the path only
  when `path_mark` exists.
- DP: a processed cell is finalized only if the trace represents it that way.

Never imply an invariant merely because it is common for the named algorithm.
Confirm it from the problem and emitted fields.