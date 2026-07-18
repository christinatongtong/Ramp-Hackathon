---
name: algorithm-animation-planner
description: Create educational animation plans from verified algorithm traces.
---

# Algorithm animation planning

Treat the execution trace as the source of truth.

1. Read the animation contract.
2. Read the scene guidance matching `config.scene.type`.
3. Use only presets, primitives, and effects listed in `visual-capabilities.json`.
4. Prefer shared grid events from `knowledge/references/grid-events.md`.
5. Bind effects only to event types present in the trace.
6. Make data-structure and state changes visually understandable.
7. Ensure the plan works for every input, not only the default example.
8. Return presentation configuration, never executable code.