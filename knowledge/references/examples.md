# Examples

These are reasoning examples, not templates. Copy the decision pattern, not the
theme. The verified trace and capability manifest always take precedence.

## Rotting Oranges

Recommended world:

- `preset`: `farm`
- `timeSystem.mode`: `day_night`, `advanceOn`: `minute`
- Props: trees on perimeter, goofy clouds in the sky

Recommended entity mappings:

- `0` → empty soil tile
- `1` → fresh fruit / orange
- `2` → rotten fruit / orange

Recommended event bindings:

- `init` → `cell_pulse`
- `enqueue` → `queue_glow`
- `dequeue` → `bounce`
- `cell_update` → `infection_poof` (optional `targetReaction`: `panic_squish`)
- `done` → `result_reveal`

Result choreography:

- success → `confetti` + `bad_dance`
- failure → `failure_deflate` + `confused_stare`

Fresh oranges should appear healthy and clearly different from rotten oranges.
BFS levels should feel like discrete minutes.

## Number of Islands

Recommended world:

- `preset`: `island`

Recommended mappings:

- `visit` → `cell_pulse`
- `enqueue` → `queue_glow`
- `cell_update` → `island_discovery`
- `done` → `result_reveal`

Each discovered island may receive a distinct color, but water must remain
visually stable.

## Shortest Path in a Binary Matrix

Reasoning:

- Family: shortest path with BFS.
- Permanent structure: open floor versus blocked walls.
- Temporary structure: frontier and visited cells.
- Final answer: path cells only if the trace emits `path_mark`.

Recommended world:

- `preset`: `generic_grid`
- `camera.mode`: `top_down`
- `0` → light `floor_tile`
- `1` → dark `wall`
- Trace-written visited/path values → related floor variants with blue/gold colors

Recommended bindings:

- `frontier_add` → `queue_glow`
- `frontier_remove` → `bounce` or `cell_pulse`
- `visit` → short `cell_pulse`
- `path_mark` → `path_reveal`

Do not reveal a path when the trace contains only visits. Exploration order and final
shortest path are different facts.

## Pacific Atlantic Water Flow

Reasoning:

- Family: multi-source reverse reachability on a height map.
- Heights remain permanent data.
- Pacific and Atlantic reachability are overlays, not replacement cell types.
- Cells in both sets become final answers only when the trace marks them.

Recommended world:

- `preset`: `island`
- `camera.mode`: `isometric` for a small height map, otherwise `top_down`
- Every supplied height value → labeled `height_block`
- `reachability_update` → restrained overlay beat (`none` is valid)
- `path_mark` → `path_reveal` for cells reachable by both oceans

Do not animate rain flowing downhill if the verified algorithm performs reverse
search from the oceans. The story may explain equivalence, but playback must show
the emitted traversal.

## Surrounded Regions / Boundary Capture

Reasoning:

- Family: boundary-connected protection followed by transformation.
- Boundary-reachable open cells and enclosed open cells must remain distinct.
- The final flip should occur only through trace-provided writes.

Recommended world:

- `preset`: `generic_grid` or `island`
- Protected boundary-connected cells → cool highlighted `floor_tile` or `land`
- Captured cells → contrasting transient/final variant
- Boundary exploration → `cell_pulse` / `queue_glow`
- Completed component → `island_discovery` only when `cells` exists
- Final flips → `infection_poof` only if the transformation metaphor is appropriate;
  otherwise use `cell_pulse`

## 01 Matrix / Distance from Sources

Reasoning:

- Family: multi-source layered BFS.
- All zero cells are simultaneous sources.
- Distance is finalized by BFS levels, not by arbitrary visit order.

Recommended world:

- `preset`: `generic_grid`
- source cells → stable, high-contrast floor state
- unreached cells → neutral floor state
- reached/distance values → labeled `height_block` only when those values are
  actually written into the displayed grid
- `level_start` → `frontier_wave`
- `frontier_add` → `queue_glow`
- `cell_update` → short `cell_pulse`

Use a static or level-based clock. Do not use farm day/night unless time progression
is genuinely part of the educational metaphor.

## Game of Life / Round-Based Simulation

Reasoning:

- Family: cellular simulation.
- The key concept is simultaneous generation change.
- Per-cell updates must not falsely suggest later cells used already-updated values.

Recommended world:

- `preset`: `generic_grid`, or `farm` if live/dead entities are clear
- alive/dead → strongly contrasting primitives or variants
- `level_start` → generation title / restrained wave
- `cell_update` → quick pulse or poof

The trace must encode the round boundary. If it emits only sequential writes, do not
claim simultaneous updates that the runtime cannot demonstrate.