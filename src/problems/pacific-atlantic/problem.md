# Pacific Atlantic Water Flow

There is an `m × n` island that borders the Pacific Ocean (top and left edges) and the Atlantic Ocean (bottom and right edges).

You are given a height map `heights` where `heights[r][c]` is the elevation at cell `(r, c)`. Rain can flow to a neighboring cell (north, south, east, or west) only if that neighbor's height is less than or equal to the current cell's height. Water can also flow from any ocean-adjacent cell into that ocean.

Return all coordinates from which water can reach **both** oceans.

## Example

![Example flow](./assets/example-flow.png)

**Input**

```json
[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]
```

**Output**

```json
[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]
```

## Constraints

- `1 <= m, n <= 200`
- `0 <= heights[r][c] <= 10^5`
