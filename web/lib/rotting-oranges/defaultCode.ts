export const DEFAULT_CODE = `function orangesRotting(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue = [];
  let fresh = 0;

  // Find rotten oranges and count fresh ones
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) queue.push([r, c, 0]);
      if (grid[r][c] === 1) fresh += 1;
    }
  }

  let minutes = 0;
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  while (queue.length > 0) {
    const [r, c, t] = queue.shift();
    minutes = Math.max(minutes, t);

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      if (grid[nr][nc] === 1) {
        grid[nr][nc] = 2;
        fresh -= 1;
        queue.push([nr, nc, t + 1]);
      }
    }
  }

  return fresh === 0 ? minutes : -1;
}`;
