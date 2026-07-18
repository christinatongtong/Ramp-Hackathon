# Shortest Path in Binary Matrix

Given an `n × n` binary matrix `grid`, return the length of the shortest clear path from the top-left cell `(0, 0)` to the bottom-right cell `(n - 1, n - 1)`. If no clear path exists, return `-1`.

A clear path:

- Only visits cells with value `0`
- Moves to any of the 8 adjacent cells (including diagonals)
- Has length equal to the number of visited cells

## Example

![Example path](./assets/example-path.png)

**Input**

```json
[[0,0,0],[1,1,0],[1,1,0]]
```

**Output**

```
4
```

## Constraints

- `1 <= n <= 100`
- Each cell is `0` or `1`
