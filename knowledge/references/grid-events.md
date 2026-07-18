# Shared grid events

Canonical solutions emit events from this vocabulary (also listed in
`visual-capabilities.json` → `gridEvents`). The frontend `compileTimeline`
mutates grid / frontier / region state from these events.

| Event | Required fields | Mutation |
|-------|-----------------|----------|
| `init` | `grid` | Replace grid (no timeline step) |
| `visit` | `row`, `col`, `value` | Write cell |
| `cell_update` | `row`, `col`, `value` | Write cell |
| `path_mark` | `row`, `col`, `value` | Write cell |
| `frontier_add` | `row`/`col` or `cells` | Add to frontier set |
| `frontier_remove` | `row`/`col` or `cells` | Remove from frontier |
| `region_discovered` | `cells`, optional `value`, `islandId` | Optional fill + region wash |
| `reachability_update` | `row`, `col`, `ocean` | Overlay flag |
| `level_start` | optional `level` | Advance clock when `advanceOn=level` |
| `done` | `result` | Final step + result choreography |

`value` may be a number or string (e.g. `"#"` for visited land).

Problem-specific aliases like `enqueue` / `dequeue` may still appear in traces;
they produce timeline steps via `eventBindings` but do not mutate the grid
unless they also carry a cell write covered above.
