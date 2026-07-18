# Ramp Hackathon — Backend

FastAPI service that runs instrumented solutions and generates animation plans.

```text
FastAPI:  localhost:8000
```

## Structure

- `backend/` — FastAPI app (trace runner, OpenAI generation, validation)
- `src/problems/` — problem packages (`problem.md`, `config.json`, `solution.py`, `animation.json`)
- `src/runner.py` — CLI / subprocess entry for solution traces
- `knowledge/` — animation skill + contracts for generation

## Adding a problem

1. Create `src/problems/<id>/` with `problem.md`, `config.json`, `solution.py`, `animation.json`
2. Append `"<id>"` to `src/problems/registry.json`

## Dev

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# copy .env.example → .env and set OPENAI_API_KEY
uvicorn backend.app:app --reload --port 8000
```

### Endpoints

- `GET /health`
- `POST /api/problems/{problem_id}/trace`
- `POST /api/problems/{problem_id}/generate-animation?save=true`
