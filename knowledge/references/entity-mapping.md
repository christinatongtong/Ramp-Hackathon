# Entity mapping

Entity mappings translate raw algorithm values into stable visual meanings. They are
presentation choices, but they must cover the actual data exactly.

## Mapping procedure

1. Treat `config.scene.cellMapping` as an optional hint only when present.
2. Inspect the initial grid and every trace write (`visit`, `cell_update`,
   `path_mark`, and a valued `region_discovered`).
3. Use the supplied `observed_cell_values` list as the required coverage set.
4. List the string form of every required value. Numeric `1` and string `"1"`
   resolve to the same frontend key, so define key `"1"` once.
5. Assign each key a semantic role and one supported entity primitive.
6. Give transient states a visibly related but distinct treatment.

Never omit a value because it appears only late in the trace. The renderer otherwise
falls back to an unlabeled gray tile.

## Primitive selection

| Semantic role | Preferred primitive | Notes |
|---|---|---|
| Empty or absent | `empty_tile` | Use for true gaps, not ordinary walkable cells. |
| Open/traversable | `floor_tile` | Neutral base for paths, mazes, and abstract boards. |
| Barrier/blocked | `wall` | Must contrast clearly with traversable cells. |
| Land/region/member | `land` | Useful for components and flood fill. |
| Water/outside | `water` | Keep stable when region colors change. |
| Goal/sink/target | `destination` | Use only when the value itself denotes a goal. |
| Elevation/cost/value | `height_block` | Keep the numeric label visible. |
| Living/spreading item | `fruit` or `orange` | Use variants/colors to show state transitions. |

Props such as `tree`, `cloud`, `fence`, and `sign` are scenery, not cell entities.

## Stable semantics

- A raw value must keep the same meaning throughout a plan.
- If an algorithm overwrites input values to mark visitation, map both the original
  and visited values. Preserve their family resemblance while changing color/glow.
- Do not use `destination` for every final path cell; use a floor/path state and
  reserve destination for the actual goal.
- Height and cost values are data, not categories. Use labeled `height_block`
  entities and overlays for reachability/visitation.
- If the meaning is abstract or uncertain, use `floor_tile` with a literal label
  instead of inventing a misleading physical object.

## Input independence

Do not write entity definitions for values found only by guessing from the example.
Cover the configured domain and trace-produced values. If a problem permits an
unbounded set of values but the package supplies only example-specific mappings,
use the generic labeled primitive consistently and do not claim exhaustive support
in the explanation.