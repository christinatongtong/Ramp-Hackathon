# Supported effects

## cell_pulse

Briefly changes a cell's scale and glow. Use for `visit`.

## queue_glow

Adds a visible border or hovering marker. Use when a cell enters the queue.

## infection_wave

Creates a directional wave from an infected source to a target. Use when
infection spreads.

## transform_entity

Transitions an entity from one configured state into another.

## island_discovery

Changes connected terrain to an island-specific color.

## frontier_expand

Displays a BFS frontier spreading across neighboring cells.

## path_reveal

Highlights cells belonging to the final reconstructed path.

## water_flow

Displays directional water or reachability movement between height cells.

## dual_ocean_glow

Highlights cells reachable from both oceans.

## result_reveal

Displays the final result after the `done` event.

Effects must clarify an actual trace event. Do not add effects solely for noise.