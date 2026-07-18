# Ramp Hackathon

Visual LeetCode playground: each problem is a self-contained package. Press **Start** to run the canonical instrumented solution and animate its events.

## Problem packages

```
src/problems/
  registry.json                 # list of problem ids (add new ones here)
  rotting-oranges/
    problem.md                  # human-readable description
    config.json                 # scene, examples, metadata
    solution.py                 # instrumented canonical solution
    assets/
  number-of-islands/
  pacific-atlantic/
  shortest-path-binary-matrix/
```

### Adding a problem

1. Create `src/problems/<id>/` with `problem.md`, `config.json`, `solution.py`, and optional `assets/`.
2. Append `"<id>"` to `registry.json`.
3. Reuse an existing `scene.type` (currently `grid`) so the Start animation works without new UI code.

### Start flow (v1)

1. UI loads problem via `src/lib/loadProblem.ts` (markdown + config).
2. On **Start**, run `python -m src.runner <id>` (or call the same from a small API).
3. Replay `events` from the JSON response with the grid scene renderer.

```bash
python3 -m src.runner rotting-oranges
python3 -m src.runner number-of-islands --example 1
```
