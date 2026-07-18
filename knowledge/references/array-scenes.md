# Array scenes

Use when `structure.type` is `array`.

## Structure block

```json
{
  "type": "array",
  "inputKey": "nums",
  "layout": "horizontal",
  "showIndices": true
}
```

Layouts (from capabilities):

- `horizontal` — equal blocks in a row (default for binary search / two pointers)
- `bars` — height encodes magnitude (sorting / histograms)
- `window` — emphasize an active `[left, right]` range

## Theme block

Keep theme separate. Example:

```json
{
  "preset": "generic_grid",
  "name": "binary-search-lane",
  "palette": { "sky": "#7ecbff", "ground": "#94a3b8", "accent": "#fbbf24" },
  "camera": {
    "mode": "isometric",
    "position": [0, 6, 12],
    "target": [0, 0.5, 0]
  },
  "props": [],
  "timeSystem": { "mode": "static", "advanceOn": "none" }
}
```

## Entities

Prefer:

- `array_block` — chunky numbered cells
- `array_bar` — magnitude bars (`layout: "bars"`)

Markers (referenced by effects / layers, not layout coordinates):

- `index_pointer` — named pointers (`left`, `right`, `mid`)
- `range_bracket` / `window_highlight` — active window

Key entities by semanticKey from bindings (e.g. `value`, `target_hit`).

## Array events

Bind only events present in the observed trace:

| Event | Meaning | Suggested effect |
|-------|---------|------------------|
| `init` | Snapshot of values | `none` / brief `show_structure` intro |
| `compare` | Examine index/indices | `compare_flash` |
| `swap` | Exchange two indices | `swap_arc` |
| `write` | Assign a value | `value_flip` |
| `pointer_move` | Move named pointer | `pointer_hop` |
| `window_expand` / `window_shrink` | Grow/shrink window | `window_slide` |
| `range_highlight` | Set `[left, right]` | `window_slide` |
| `element_finalize` | Index settled | `bounce` |
| `done` | Result ready | result choreography |

## Intro

Prefer `show_structure` + `show_title` so learners see the array lane before
playback. Do not invent grid-only intro actions unless they still make sense.
