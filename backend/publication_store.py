"""Publication status for hub unlock — separate from animation.json."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from backend.problem_loader import get_problem_directory
from backend.schemas import PublicationRecord


def publication_path(problem_id: str) -> Path:
    return get_problem_directory(problem_id) / "publication.json"


def load_publication(problem_id: str) -> PublicationRecord | None:
    path = publication_path(problem_id)
    if not path.exists():
        return None
    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        return None
    return PublicationRecord.model_validate(json.loads(raw))


def save_publication(problem_id: str, record: PublicationRecord) -> None:
    path = publication_path(problem_id)
    path.write_text(record.model_dump_json(indent=2) + "\n", encoding="utf-8")


def mark_published(problem_id: str) -> PublicationRecord:
    record = PublicationRecord(
        status="published",
        generatedAt=datetime.now(timezone.utc).isoformat(),
        generatorVersion="1",
        errors=[],
    )
    save_publication(problem_id, record)
    return record


def mark_failed(problem_id: str, errors: list[str]) -> PublicationRecord:
    record = PublicationRecord(
        status="generation_failed",
        generatedAt=datetime.now(timezone.utc).isoformat(),
        generatorVersion="1",
        errors=errors,
    )
    save_publication(problem_id, record)
    return record


def is_published(problem_id: str) -> bool:
    record = load_publication(problem_id)
    return record is not None and record.status == "published"
