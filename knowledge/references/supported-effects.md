# Supported effects

Use only effects from the response schema. Unlisted names are rejected.

## pulse / cell_pulse

Briefly changes a cell's scale and glow. Use for `visit` or `init`.

## bounce

A short vertical bounce. Use for `dequeue` or playful highlights.

## wobble / squish

Organic squash reactions. Prefer as `targetReaction`, not as the primary
effect, unless the event is purely decorative.

## queue_glow

Adds a visible border or hovering marker. Use when a cell enters the queue.

## infection_poof / infection_wave

Shows infection spreading into a fresh cell. Prefer `infection_poof` for
discrete cell updates; use `infection_wave` when directionality helps.

## transform_entity

Transitions an entity from one configured state into another.

## island_discovery

Changes connected terrain to an island-specific color.

## frontier_wave / frontier_expand

Displays a BFS frontier spreading across neighboring cells.

## path_reveal

Highlights cells belonging to the final reconstructed path.

## water_flow

Displays directional water or reachability movement between height cells.

## dual_ocean_glow

Highlights cells reachable from both oceans.

## result_reveal

Displays the final result after the `done` event.

## confetti / failure_deflate / camera_shake

Result choreography only. Bind these under `resultChoreography`, not as
algorithm event effects, unless the trace itself has a matching event.

Effects must clarify an actual trace event. Do not add effects solely for noise.
