# Supported effects

Use only effects listed in `visual-capabilities.json` at the repository root.
Unlisted names are rejected by the validator. Do not request an effect until the
frontend registry renders it.

## none

No visual reaction. Use sparingly for bookkeeping events.

## cell_pulse

Briefly changes a cell's scale and glow. Use for `visit` or `init`.

## bounce

A short vertical bounce on the active cell. Useful for queue dequeue beats.

## queue_glow

Adds a visible ring around a cell. Use when a cell enters a frontier or queue.

## infection_poof

Particle burst + color flash when a cell transforms (e.g. fresh → rotten).

## island_discovery

Washes a discovered region (`cells` list) with an island highlight color.

## frontier_wave

Expanding ring from the active cell as a BFS frontier spreads.

## path_reveal

Highlights cells belonging to a reconstructed path.

## result_reveal

Soft highlight when the algorithm finishes (`done`).

## confetti / failure_deflate

Result choreography. Prefer binding these under `resultChoreography`.

Effects must clarify an actual trace event. Do not add effects solely for noise.
