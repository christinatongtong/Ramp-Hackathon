# Grid scenes

Use a grid scene for matrix, maze, flood-fill, island, and cellular problems.

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