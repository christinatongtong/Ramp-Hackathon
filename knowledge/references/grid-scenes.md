# Grid scenes

Use a grid scene for matrix, maze, flood-fill, island, and cellular problems.

## World presets

Choose a `world.preset` the frontend already knows how to render:

- `farm` — orchards, fruit, day/night (e.g. rotting oranges)
- `island` — land/water islands
- `mountain` — height maps and elevation
- `maze` — walls and paths
- `generic_grid` — fallback grid world

Set `world.sceneType` to match `config.scene.type` (`grid` or `height_map`).

Fill `world.palette` (sky, ground, accent), optional `world.props` from supported
primitives (`tree`, `cloud`, `goofy_cloud`, `fence`, `sign`, …), and
`world.timeSystem` when BFS minutes should advance day/night.

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
