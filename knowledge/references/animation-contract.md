# Animation contract

The canonical solution produces the algorithm's factual event sequence.

The animation plan may style an event, but it may not:

- Create new algorithm events
- Change event order
- Change coordinates
- Change cell values
- Change the result
- Infer events missing from the trace

Common trace events:

- `init`: Initialize the world.
- `visit`: The algorithm examines a cell.
- `enqueue`: A cell enters a BFS queue.
- `dequeue`: A cell leaves a BFS queue.
- `cell_update`: A cell changes value or state.
- `level_start`: A new BFS level or minute begins.
- `island_start`: A new connected component begins (DFS flood-fill).
- `island_complete`: A connected component is fully explored.
- `both`: A height cell is reachable from Pacific and Atlantic.
- `path`: A cell belongs to the final path.
- `done`: Execution completes.

The exact available events are supplied in the verified trace.
