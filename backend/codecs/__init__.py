"""Structure codecs: JSON ↔ LeetCode object graphs for judging."""

from __future__ import annotations

from backend.codecs.registry import get_codec, list_codecs

__all__ = ["get_codec", "list_codecs"]
