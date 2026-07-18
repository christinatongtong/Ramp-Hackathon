# Ramp Hackathon — Backend

FastAPI service that runs instrumented solutions and generates animation plans.

```text
FastAPI:  localhost:8000
Next.js:  localhost:3000
```

## Structure

- `backend/` — FastAPI app (trace runner, OpenAI generation, validation)
- `src/problems/` — problem packages (`problem.md`, `config.json`, `solution.py`, `animation.json`)
- `src/runner.py` — CLI / subprocess entry for solution traces
- `knowledge/` — animation skill + contracts for generation
- `web/` — generic Next.js world renderer (`AlgorithmGame`, `WorldRenderer`)

## Responsibility split

| Source | Provides |
|--------|----------|
| Problem files | Title, description, examples, starter skeleton |
| Judge (user code) | Pass/fail + verdict (wrong answer, syntax, runtime, TLE) |
| Canonical `solution.py` | Animation events — only after acceptance |
| GPT (once) | `animation.json` visual plan (theme, entities, effects) |
| Next.js | World presets, entity meshes, effect library, UI chrome |

### Run flow

1. Page load → static initial world (no solution animation)
2. User writes Python → Run
3. Backend judges against public + hidden tests
4. Fail → large X, no animation
5. Pass → unlock canonical traced animation

## Adding a problem

1. Create `src/problems/<id>/` with `problem.md`, `config.json` (include `entrypoint` + `starterCode`), `solution.py`
2. Append `"<id>"` to `src/problems/registry.json`
3. Generate the visual plan once:

```bash
python -m backend.generate_once <id> --style derpy
```

This writes presentation-only `animation.json` (no execution embedded).

4. Open the hub at `/select` — portals with a saved visual plan are unlocked.

## Dev

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# copy .env.example → .env and set OPENAI_API_KEY
uvicorn backend.app:app --reload --port 8000

# frontend
cd web && npm install && npm run dev
```

### Endpoints

- `GET /health`
- `GET /api/problems` — catalog (includes `hasVisualPlan`)
- `GET /api/problems/{id}` — public problem detail (no hidden tests)
- `GET /api/problems/{id}/package` — `{ problem, visualPlan, initialState }` (no execution)
- `POST /api/problems/{id}/run` — body `{ code, exampleIndex }` → judge user Python; returns canonical `execution` only when accepted
- `POST /api/problems/{id}/trace` — tooling: canonical instrumented trace
- `POST /api/problems/{id}/generate-animation?save=true` — force GPT regenerate visual plan
