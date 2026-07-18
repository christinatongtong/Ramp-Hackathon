---
name: algorithm-animation-planner
description: Turn a verified grid-algorithm trace into a clear, playful, input-independent visual plan supported by the declarative renderer.
---

# Algorithm animation planner

## Goal

Create a visual explanation of the algorithm, not merely a themed grid. A learner
should be able to identify the input state, active cell, frontier or search region,
state transitions, and final answer without reading the implementation.

## Truth hierarchy

When sources disagree, follow this order:

1. The verified execution trace controls behavior, order, coordinates, values, and result.
2. Observed cell values and event types from the trace (plus optional config hints)
   control what must be bound.
3. `visual-capabilities.json` controls what the frontend can render.
4. The problem statement explains the meaning of the data.
5. These knowledge files guide presentation choices.
6. The requested style affects tone only; it never overrides correctness.

## Planning workflow

Perform these steps before producing the plan:

1. Classify the problem using `references/problem-taxonomy.md`.
2. Read the initial state and list every required and trace-produced cell value.
3. Assign each value one stable semantic role using
   `references/entity-mapping.md`.
4. Identify the algorithm's invariant: what becomes known after each meaningful event?
5. Choose the closest supported world preset. Prefer `generic_grid` when a themed
   preset would distort the algorithm.
6. Bind only emitted events, using the smallest effect that communicates each event.
7. Design an intro that explains the legend, sources, and destination before playback.
8. Run the quality gate in `references/quality-checklist.md`.

## Non-negotiable rules

- Treat the execution trace as the only source of algorithmic truth.
- Use only capabilities explicitly supplied in `visual-capabilities.json`.
- Define an entity for every required cell value, including transient values written
  by `visit`, `cell_update`, `path_mark`, or `region_discovered`.
- Keep the visual meaning of a value stable for the entire run.
- Make the plan work across different grid sizes and valid inputs, not only the
  supplied example.
- Preserve the grid's topology. Never move cells to make a prettier composition.
- Prefer visual hierarchy over spectacle: state first, algorithm second, decoration last.
- Return presentation configuration only. Never return executable code or new events.

## Derpy style

“Derpy” means warm, chunky, readable, and lightly humorous. It may influence
expressions, idle motion, props, and celebration. It must not make blocked/open,
visited/unvisited, source/destination, or reachable/unreachable states ambiguous.