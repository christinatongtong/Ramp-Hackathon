# Linked-list scenes

Use when `structure.type` is `linked_list`.

## Core ideas

- **Nodes preserve identity** even when links change. `n0` stays `n0` after
  rewiring; only `next` changes.
- **Values and node IDs are different.** Value `1` may live on `n0`; never
  confuse the numeric payload with the stable ID.
- **Pointer variables are overlays**, not nodes. `prev` / `curr` / `next` float
  above cars and may be `null`.
- **`next` arrows represent current structure.** Animate the edge being changed
  (`edge_break` / `edge_connect`) *before* hopping pointers onward.
- **Never infer a cycle** unless the trace establishes one.
- **Keep node positions stable** during pointer rewires. Rearrange at most once
  after the list is fully reversed.
- **Null needs a visible endpoint** (a grey sink beyond the last car).

## Structure block

```json
{
  "type": "linked_list",
  "inputKey": "head",
  "layout": "horizontal_train"
}
```

## Events

Bind only observed events:

| Event | Meaning | Suggested effect |
|-------|---------|------------------|
| `init` | Nodes + headId | `none` / `show_structure` |
| `pointer_set` | Assign named pointer (may be null) | `pointer_hop` |
| `pointer_move` | Move named pointer between nodes | `pointer_hop` |
| `link_update` | Change `node.next` | `edge_break` then `edge_connect` |
| `node_visit` | Examine a node | `bounce` |
| `node_finalize` | Node settled in final order | `list_complete` / `bounce` |
| `done` | Result ready | result choreography |

## Entities

Prefer `list_node` for cars. Markers use `named_pointer`. Connections use
`next_pointer` conceptually (renderer draws edges from `next` fields).
