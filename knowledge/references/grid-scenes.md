# Grid scenes

Use a grid scene for matrix, maze, flood-fill, island, and cellular problems.

## World presets

Choose a `world.preset` from `visual-capabilities.json` (frontend must already
render it):

- `farm` — orchards, fruit, day/night (e.g. rotting oranges)
- `island` — land/water islands (e.g. number of islands)
- `generic_grid` — neutral flat grid fallback

Do not invent presets. Mountain/maze skins ship later; until then use
`generic_grid` or the closest supported preset.

Set `world.sceneType` to match `config.scene.type` (`grid` or `height_map`).

Fill `world.palette` (sky, ground, accent), optional `world.props` from
supported prop primitives (`tree`, `cloud`, `goofy_cloud`, `fence`, `sign`),
and `world.timeSystem` when the clock should advance day/night.

## Shared grid events

Canonical solutions should emit from this vocabulary (see
`visual-capabilities.json` → `gridEvents`):

- `init` — initial grid snapshot
- `visit` — mark a cell visited (`row`, `col`, `value`)
- `frontier_add` / `frontier_remove` — BFS frontier membership
- `cell_update` — mutate a cell value
- `region_discovered` — flood-fill / island complete (`cells`, optional `islandId`)
- `reachability_update` — ocean / reachability overlays
- `path_mark` — shortest-path reconstruction
- `level_start` — layered BFS / minute boundary
- `done` — final result

## Visual priorities

1. Current cell
2. Frontier or queue
3. Visited cells
4. State changes
5. Final result

Use an isometric camera when entities and environmental storytelling matter.
Use a top-down camera when exact coordinates or paths matter more.

Do not move grid cells during execution. Animate their color, scale, glow,
surface, or contained entity instead.

Keep blocked, traversable, visited, and frontier states visually distinct.
