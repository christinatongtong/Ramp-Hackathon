# Examples

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
- `timeSystem.mode`: `steady_day`, `advanceOn`: `island_complete`
- Props: lighthouses on distant rocks, sailboats on the horizon, seagulls overhead

Recommended entity mappings:

- `0` → water tile (flat, animated ripple)
- `1` → unvisited land (sandy green mound)
- `#` → visited land (same island palette, slightly sunken)

Recommended event bindings:

- `init` → `cell_pulse`
- `island_start` → `flag_plant` (optional `targetReaction`: `surprise_pop`)
- `visit` → `island_discovery`
- `island_complete` → `bounce`
- `done` → `result_reveal`

Result choreography:

- success → `confetti` + island counter tick-up per `island_complete`
- failure → `confused_stare` + `failure_deflate`

Each discovered island should receive a distinct palette color, but water must
remain visually stable. DFS should feel like painting one island at a time before
moving to the next unvisited `1`.


## Pacific Atlantic Water Flow

Recommended world:

- `preset`: `coastal_watershed`
- `timeSystem.mode`: `tide_cycle`, `advanceOn`: `visit_batch`
- Props: Pacific ocean along top/left borders, Atlantic along bottom/right, height blocks in the center

Recommended entity mappings:

- `height` → elevation block (taller = higher `height` value)
- overlay `pacific-reach` → teal wash from Pacific borders
- overlay `atlantic-reach` → deep-blue wash from Atlantic borders
- overlay `both` → white-gold dual glow where sets intersect

Recommended event bindings:

- `init` → `cell_pulse`
- `visit` → `water_flow` (use `ocean` payload: `pacific` or `atlantic`)
- `both` → `dual_ocean_glow`
- `done` → `result_reveal`

Result choreography:

- success → sweep `dual_ocean_glow` across all `both` cells, then `confetti`
- failure → `confused_stare` (empty result set)

Uphill/downhill movement must stay obvious through block height. Pacific reach
should read as one ocean color; Atlantic as another. Never blend the two overlays
into mud — switch to `dual_ocean_glow` when a cell is in both sets. Multi-source
DFS should feel like water climbing inward from each border.


## Shortest Path in Binary Matrix

Recommended world:

- `preset`: `binary_maze`
- `timeSystem.mode`: `steady_night`, `advanceOn`: `distance`
- Props: start beacon at `(0,0)`, goal lantern at `(n-1,n-1)`, wall pillars on blocked cells

Recommended entity mappings:

- `0` → open floor tile
- `1` → blocked wall pillar

Recommended event bindings:

- `init` → `cell_pulse`
- `visit` → `cell_pulse`
- `enqueue` → `queue_glow`
- `dequeue` → `frontier_expand`
- `path` → `path_reveal`
- `done` → `result_reveal`

Result choreography:

- success → `path_reveal` sweep, then `confetti` + `bad_dance`
- failure (`result: -1`) → `failure_deflate` + `confused_stare` — do not invent path steps

Open cells and blocked walls must stay visually distinct at all times. BFS should
feel like a frontier expanding through the maze, including diagonal moves. When
the goal is reached, animate the reconstructed path with `path_reveal` before
showing the final distance.
