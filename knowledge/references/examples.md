# Examples

## Rotting Oranges

Recommended mappings:

- `init` → `cell_pulse`
- `enqueue` → `queue_glow`
- `cell_update` → `infection_wave`
- `done` → `result_reveal`

Fresh oranges should appear healthy and clearly different from rotten oranges.
An infection animation should travel from source to target. BFS levels should
feel like discrete minutes.

## Number of Islands

Recommended mappings:

- `visit` → `cell_pulse`
- `enqueue` → `queue_glow`
- `cell_update` → `island_discovery`
- `done` → `result_reveal`

Each discovered island may receive a distinct color, but water must remain
visually stable.