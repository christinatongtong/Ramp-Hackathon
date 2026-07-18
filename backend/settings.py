from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(_ROOT / ".env")


class Settings:
    """Single source of truth for environment configuration."""

    def __init__(self) -> None:
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is missing. Add it to the repository's .env file."
            )

        self.openai_api_key: str = api_key
        self.openai_model: str = os.getenv("OPENAI_MODEL", "gpt-5.6-sol")
        self.frontend_origin: str = os.getenv(
            "FRONTEND_ORIGIN",
            "http://localhost:3000",
        )
        self.problems_root: Path = Path(
            os.getenv("PROBLEMS_ROOT", str(_ROOT / "src" / "problems"))
        ).resolve()
        self.knowledge_root: Path = Path(
            os.getenv("KNOWLEDGE_ROOT", str(_ROOT / "knowledge"))
        ).resolve()
        self.root: Path = _ROOT


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
