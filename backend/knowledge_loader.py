from __future__ import annotations

from backend.settings import get_settings


def load_knowledge() -> str:
    """Recursively load every Markdown file under knowledge/.

    Order:
    1. knowledge/SKILL.md (if present)
    2. Everything else under knowledge/, alphabetically by relative path
    """

    knowledge_root = get_settings().knowledge_root

    if not knowledge_root.is_dir():
        raise FileNotFoundError(f"Knowledge root not found: {knowledge_root}")

    skill_path = knowledge_root / "SKILL.md"
    markdown_files = sorted(
        path
        for path in knowledge_root.rglob("*.md")
        if path.is_file() and path != skill_path
    )

    ordered_paths = ([skill_path] if skill_path.exists() else []) + markdown_files

    if not ordered_paths:
        raise FileNotFoundError(f"No Markdown knowledge files found in {knowledge_root}")

    sections: list[str] = []

    for path in ordered_paths:
        relative = path.relative_to(knowledge_root).as_posix()
        sections.append(
            f"\n\n--- BEGIN {relative} ---\n"
            f"{path.read_text(encoding='utf-8')}"
            f"\n--- END {relative} ---"
        )

    return "".join(sections)
