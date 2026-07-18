---
name: algorithm-animation-planner
description: Turn a verified algorithm trace into a clear, playful, input-independent visual plan supported by the declarative multi-structure renderer.
---

# Algorithm animation planner

## Goal

Create a visual explanation of the algorithm, not merely a themed backdrop. A
learner should identify the input state, active focus (cell / index / window),
state transitions, and final answer without reading the implementation.

## Truth hierarchy

When sources disagree, follow this order:

1. The verified execution trace controls behavior, order, coordinates, values, and result.
2. Observed values and event types from the trace (plus optional config hints)
   control what must be bound.
3. `visual-capabilities.json` controls what the frontend can render.
4. The problem statement explains the meaning of the data.
5. These knowledge files guide presentation choices.
6. The requested style affects tone only; it never overrides correctness.

## Planning workflow

Perform these steps before producing the plan:

1. Classify the problem using `references/problem-taxonomy.md`.
2. Choose `structure.type` using `references/structure-selection.md`. It MUST
   match `init.structure` / observed structure type.
3. Read the initial state and list every required and trace-produced value.
4. Assign each value one stable semantic role using
   `references/entity-mapping.md`.
5. Identify the algorithm's invariant: what becomes known after each meaningful event?
6. Fill `theme` separately (preset, palette, props, camera, timeSystem). Prefer
   `generic_grid` when a themed preset would distort the algorithm.
7. For grids, follow `references/grid-scenes.md` + `grid-events.md`.
   For arrays, follow `references/array-scenes.md`.
   For linked lists, follow `references/linked-list-scenes.md`.
   For binary trees, follow `references/binary-tree-scenes.md`.
   For graphs, follow `references/graph-scenes.md`.
8. Bind only emitted events, using the smallest effect that communicates each event.
9. Design an intro that explains the legend before playback.
10. Run the quality gate in `references/quality-checklist.md`.

## Non-negotiable rules

- Treat the execution trace as the only source of algorithmic truth.
- Use only capabilities explicitly supplied in `visual-capabilities.json`.
- `visualPlan.structure` describes topology; `visualPlan.theme` describes art.
- Never generate layout coordinates — only layout enums from capabilities.
- Define an entity for every required value, including transient writes.
- Keep the visual meaning of a value stable for the entire run.
- Make the plan work across different sizes and valid inputs, not only the example.
- Prefer visual hierarchy over spectacle: state first, algorithm second, decoration last.
- Return presentation configuration only. Never return executable code or new events.

## Derpy style

“Derpy” means warm, chunky, readable, and lightly humorous. It may influence
expressions, idle motion, props, and celebration. It must not make blocked/open,
visited/unvisited, source/destination, pointer identity, or window bounds ambiguous.
