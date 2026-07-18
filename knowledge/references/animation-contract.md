# Animation contract

The canonical solution produces the algorithm's factual event sequence.

The animation plan may style an event, but it may not:

- Create new algorithm events
- Change event order
- Change coordinates
- Change cell values
- Change the result
- Infer events missing from the trace

Prefer the shared grid-event vocabulary in `grid-events.md` /
`visual-capabilities.json` → `gridEvents`:

- `init` — initial grid snapshot
- `visit` — examine / mark a cell (`row`, `col`, optional `value`)
- `frontier_add` / `frontier_remove` — BFS frontier membership
- `cell_update` — a cell changes value
- `region_discovered` — connected component complete (`cells`)
- `reachability_update` — overlay flag (e.g. ocean)
- `path_mark` — final path cell
- `level_start` — BFS level / minute boundary
- `done` — execution completes

Legacy aliases such as `enqueue`, `dequeue`, or `path` may still appear in older
traces. Bind only events that are actually present. Do not invent shared-vocab
events that the trace did not emit.

The exact available events are supplied in the verified / observed event list.
