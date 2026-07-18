from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.animation_generator import generate_animation_plan
from backend.context_loader import load_problem, run_problem_trace
from backend.validator import validate_animation_plan


app = FastAPI(
    title="Algorithm World API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/problems/{problem_id}/trace")
def create_trace(problem_id: str) -> dict:
    try:
        load_problem(problem_id)
        return run_problem_trace(problem_id)
    except (FileNotFoundError, ValueError, RuntimeError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/api/problems/{problem_id}/generate-animation")
def create_animation(problem_id: str, save: bool = True) -> dict:
    try:
        problem = load_problem(problem_id)
        trace = run_problem_trace(problem_id)
        plan = generate_animation_plan(problem, trace)
        validate_animation_plan(plan, problem, trace)

        if save:
            output_path = problem["directory"] / "animation.json"
            output_path.write_text(
                plan.model_dump_json(indent=2) + "\n",
                encoding="utf-8",
            )

        return {
            "problem_id": problem_id,
            "trace_event_count": len(trace.get("events", [])),
            "animation": plan.model_dump(mode="json"),
        }

    except (FileNotFoundError, ValueError, RuntimeError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error