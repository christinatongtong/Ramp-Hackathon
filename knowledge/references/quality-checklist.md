# Visual plan quality gate

Check every item before returning a plan.

## Correctness

- Every event binding exists in the verified trace.
- Every required and trace-produced cell value has an entity definition.
- Explanations describe only fields and mutations actually present.
- The plan does not contain coordinates, results, grids, or algorithm steps.
- The plan works for different valid inputs and grid sizes.

## Renderer compatibility

- Preset, entity primitive, prop primitive, and effect names occur in the supplied
  capability manifest exactly as written.
- Effects that target a cell are bound only to events with `row` and `col`.
- Region effects are bound only to events with `cells`.
- Time advancement matches available `minute`, `level`, or event timing fields.
- Intro actions and camera cues are supported by the response schema.

## Learning value

- The intro establishes the grid legend and important sources/destination.
- Permanent state, frontier, active cell, visited state, and final state are distinct.
- A learner can state what changed after each major event.
- Repeated events are fast and visually restrained.
- Final choreography does not cover the answer or final grid.

## Art direction

- The metaphor matches the problem rather than merely its title.
- The theme is specific enough to feel intentional but generic across inputs.
- Props stay away from cell coordinates.
- Humor appears in expressions and reactions, not in misleading semantics.
- Colors remain legible and do not depend on red/green distinction alone.