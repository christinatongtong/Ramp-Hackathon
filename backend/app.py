from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.animation_service import (
    VisualPlanMissingError,
    create_animation_package,
    get_client_package,
)
from backend.problem_loader import get_problem_detail, list_problems, load_problem
from backend.runner_service import UserCodeNotEnabledError, run_submission, run_solution
from backend.schemas import (
    AnimationPackage,
    BuildProblemRequest,
    BuildProblemResponse,
    BuildResponse,
    ClientAnimationPackage,
    ExecutionResult,
    GenerateAnimationRequest,
    RunRequest,
    RunResponse,
)
from backend.settings import get_settings


settings = get_settings()

app = FastAPI(
    title="Algorithm World API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/problems")
def get_problems():
    try:
        return list_problems()
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.get("/api/problems/{problem_id}")
def get_problem(problem_id: str):
    try:
        return get_problem_detail(problem_id)
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.get(
    "/api/problems/{problem_id}/package",
    response_model=ClientAnimationPackage,
)
def get_package(
    problem_id: str,
    exampleIndex: int | None = Query(default=None),
    force: bool = Query(default=False),
    style: str = Query(default="derpy"),
) -> ClientAnimationPackage:
    try:
        return get_client_package(
            problem_id,
            example_index=exampleIndex,
            force_visual=force,
            style=style,
        )
    except VisualPlanMissingError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except UserCodeNotEnabledError as error:
        raise HTTPException(status_code=501, detail=str(error)) from error
    except (FileNotFoundError, ValueError, RuntimeError) as error:
        status = 404 if "Unknown problem" in str(error) else 400
        raise HTTPException(status_code=status, detail=str(error)) from error


@app.post(
    "/api/problems/{problem_id}/run",
    response_model=RunResponse,
)
def run_problem(problem_id: str, request: RunRequest) -> RunResponse:
    try:
        problem = load_problem(problem_id)
        return run_submission(
            problem,
            code=request.code,
            example_index=request.exampleIndex,
        )
    except (FileNotFoundError, ValueError, RuntimeError) as error:
        status = 404 if "Unknown problem" in str(error) else 400
        raise HTTPException(status_code=status, detail=str(error)) from error


@app.post(
    "/api/problems/{problem_id}/trace",
    response_model=ExecutionResult,
)
def create_trace(
    problem_id: str,
    request: GenerateAnimationRequest | None = None,
) -> ExecutionResult:
    body = request or GenerateAnimationRequest()

    try:
        problem = load_problem(problem_id)
        return run_solution(
            problem,
            example_index=body.exampleIndex,
            user_code=body.userCode,
        )
    except UserCodeNotEnabledError as error:
        raise HTTPException(status_code=501, detail=str(error)) from error
    except (FileNotFoundError, ValueError, RuntimeError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post(
    "/api/problems/{problem_id}/build",
    response_model=BuildProblemResponse,
)
def build_problem_endpoint(
    problem_id: str,
    request: BuildProblemRequest | None = None,
) -> BuildProblemResponse:
    """One-call: analyze trace → GPT semantic+visual → validate → publish.

    Shares `build_and_publish_problem` with `python -m backend.build_once`.
    """

    body = request or BuildProblemRequest()
    try:
        from backend.problem_builder import build_from_request

        return build_from_request(problem_id, body)
    except (FileNotFoundError, ValueError, RuntimeError) as error:
        status = 404 if "Unknown problem" in str(error) else 400
        raise HTTPException(status_code=status, detail=str(error)) from error


@app.post(
    "/api/problems/{problem_id}/generate-animation",
    response_model=AnimationPackage,
)
def generate_animation(
    problem_id: str,
    request: GenerateAnimationRequest,
    save: bool = Query(default=False),
) -> AnimationPackage:
    try:
        return create_animation_package(
            problem_id=problem_id,
            example_index=request.exampleIndex,
            user_code=request.userCode,
            style=request.style,
            force=True,
            save=save,
        )
    except UserCodeNotEnabledError as error:
        raise HTTPException(status_code=501, detail=str(error)) from error
    except (FileNotFoundError, ValueError, RuntimeError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
