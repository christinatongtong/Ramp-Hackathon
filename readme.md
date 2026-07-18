# Ramp Hackathon

Visual LeetCode playground.

```text
Next.js frontend:  localhost:3000
FastAPI backend:   localhost:8000
```

## Structure

- `src/app/` — Next.js App Router pages
- `src/problems/` — problem packages (`problem.md`, `config.json`, `solution.py`, `animation.json`)
- `public/problems/` — assets referenced by URL (e.g. `/problems/rotting-oranges/orange.png`)
- `backend/` — FastAPI (Python runner, OpenAI, validation)
- `knowledge/` — animation skill + contracts for generation

## Adding a problem

1. Create `src/problems/<id>/` with `problem.md`, `config.json`, `solution.py`, `animation.json`
2. Append `"<id>"` to `src/problems/registry.json`
3. Put public sprites in `public/problems/<id>/`
4. Reuse `scene.type: "grid"` so Start playback works without new UI

## Dev

```bash
npm install
npm run dev

# backend (separate terminal)
# uvicorn backend.app:app --reload --port 8000
```
