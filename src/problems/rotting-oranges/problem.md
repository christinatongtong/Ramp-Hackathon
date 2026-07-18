# Rotting Oranges

You are given an `m × n` grid where:

- `0` represents an empty cell
- `1` represents a fresh orange
- `2` represents a rotten orange

Every minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten.

Return the minimum number of minutes that must elapse until no fresh oranges remain. If it is impossible, return `-1`.

## Example

![Example grid](./assets/example-grid.png)

**Input**

```json
[[2,1,1],[1,1,0],[0,1,1]]
```

**Output**

```
4
```

## Constraints

- `1 <= m, n <= 10`
- Each cell contains `0`, `1`, or `2`
