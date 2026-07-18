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

Recommended mappings:

- `visit` → `cell_pulse`
- `enqueue` → `queue_glow`
- `cell_update` → `island_discovery`
- `done` → `result_reveal`

Each discovered island may receive a distinct color, but water must remain
visually stable.
