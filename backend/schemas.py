from __future__ import annotations

from pathlib import Path
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter

from backend.capabilities import (
    supported_effects,
    supported_presets,
    supported_primitives,
)


SceneType = Literal["grid", "array", "linked_list", "binary_tree", "graph"]
CameraMode = Literal["top_down", "isometric", "follow"]
RunMode = Literal["canonical", "user"]
# Keep in sync with visual-capabilities.json presets (theme skins).
WorldPreset = Literal["farm", "island", "generic_grid"]
PropPlacement = Literal["perimeter", "sky", "back", "front", "scatter"]
TimeAdvanceOn = Literal["minute", "level", "event", "none"]
GridLayout = Literal["top_down", "isometric"]
ArrayLayout = Literal["horizontal", "bars", "window"]
LinkedListLayout = Literal["horizontal_train"]
BinaryTreeLayout = Literal["layered"]
GraphLayout = Literal["circle"]

# Keep in sync with visual-capabilities.json entityPrimitives + propPrimitives + markers.
PrimitiveType = Literal[
    "empty_tile",
    "floor_tile",
    "fruit",
    "orange",
    "land",
    "water",
    "wall",
    "destination",
    "height_block",
    "array_block",
    "array_bar",
    "list_node",
    "tree_node",
    "graph_node",
    "tree",
    "cloud",
    "sign",
    "fence",
    "goofy_cloud",
    "index_pointer",
    "range_bracket",
    "window_highlight",
    "named_pointer",
    "next_pointer",
    "tree_edge",
    "graph_edge",
]

IdleAnimation = Literal[
    "none",
    "gentle_bounce",
    "gentle_float",
    "sick_wobble",
    "water_ripple",
    "soft_glow",
]

EntityReaction = Literal[
    "none",
    "panic_squish",
    "bad_dance",
    "confused_stare",
    "brief_focus",
]

# Keep in sync with visual-capabilities.json effects.
AnimationEffect = Literal[
    "none",
    "cell_pulse",
    "bounce",
    "queue_glow",
    "infection_poof",
    "island_discovery",
    "frontier_wave",
    "path_reveal",
    "result_reveal",
    "confetti",
    "failure_deflate",
    "compare_flash",
    "swap_arc",
    "pointer_hop",
    "window_slide",
    "value_flip",
    "edge_break",
    "edge_connect",
    "list_complete",
    "child_swap_flash",
    "subtree_glow",
    "cycle_pulse",
]

IntroActionType = Literal[
    "show_grid",
    "show_structure",
    "camera_pan",
    "show_title",
    "highlight_sources",
    "highlight_destination",
]

SUPPORTED_EFFECTS: frozenset[str] = supported_effects()
SUPPORTED_PRIMITIVES: frozenset[str] = supported_primitives()
SUPPORTED_PRESETS: frozenset[str] = supported_presets()


class StrictModel(BaseModel):
    """OpenAI structured outputs require additionalProperties=false."""

    model_config = ConfigDict(extra="forbid")


# ---------------------------------------------------------------------------
# Request / problem packages
# ---------------------------------------------------------------------------


class GenerateAnimationRequest(BaseModel):
    exampleIndex: int = 0
    userCode: str | None = None
    style: str = "derpy"
    force: bool = False


Verdict = Literal[
    "accepted",
    "wrong_answer",
    "syntax_error",
    "runtime_error",
    "time_limit_exceeded",
]


class RunRequest(BaseModel):
    """Submitted user Python for judging."""

    code: str = Field(min_length=1)
    exampleIndex: int = 0


class ProblemPackage(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: str
    directory: Path
    problem_markdown: str
    config: dict[str, Any]
    solution: str


class ProblemSummary(BaseModel):
    id: str
    title: str
    difficulty: str
    category: str
    algorithm: list[str] = Field(default_factory=list)
    number: int | None = None
    hasVisualPlan: bool = False


class ProblemExample(BaseModel):
    name: str | None = None
    input: Any
    expected: Any


class JudgeTest(BaseModel):
    input: Any
    expected: Any
    hidden: bool = False
    name: str | None = None


class EntrypointSpec(BaseModel):
    language: str = "python"
    className: str = "Solution"
    methodName: str = "solve"
    arguments: list[str] = Field(default_factory=list)
    argumentCodecs: dict[str, str] = Field(default_factory=dict)
    returnCodec: str | None = None


class ProblemFacts(BaseModel):
    """Frontend-facing problem content extracted from files — never GPT-generated."""

    id: str
    title: str
    difficulty: str
    category: str
    algorithm: list[str] = Field(default_factory=list)
    number: int | None = None
    description: str
    examples: list[ProblemExample] = Field(default_factory=list)
    entrypoint: EntrypointSpec
    starterCode: str = ""
    defaultExample: int = 0


class ProblemDetail(BaseModel):
    id: str
    title: str
    difficulty: str
    category: str
    algorithm: list[str]
    problemMarkdown: str
    config: dict[str, Any]


# ---------------------------------------------------------------------------
# Execution (truthful algorithm output — never invented by the LLM)
# ---------------------------------------------------------------------------


class ExecutionResult(BaseModel):
    result: Any
    expected: Any
    passed: bool
    initialState: dict[str, Any]
    finalState: dict[str, Any]
    events: list[dict[str, Any]]


class RunResponse(BaseModel):
    """Judge-first run response. execution is set only when passed."""

    passed: bool
    verdict: Verdict
    message: str
    testsPassed: int = 0
    testsTotal: int = 0
    execution: ExecutionResult | None = None


# ---------------------------------------------------------------------------
# Visual plan (presentation only — generated by the LLM)
# ---------------------------------------------------------------------------


class CameraConfig(StrictModel):
    mode: CameraMode
    position: list[float] = Field(min_length=3, max_length=3)
    target: list[float] = Field(min_length=3, max_length=3)


class PaletteSpec(StrictModel):
    sky: str
    ground: str
    accent: str


class WorldProp(StrictModel):
    primitive: PrimitiveType
    placement: PropPlacement
    count: int = Field(ge=1, le=32)


class TimeSystemSpec(StrictModel):
    mode: Literal["day_night", "static"] = "static"
    advanceOn: TimeAdvanceOn = "none"


class GridStructureSpec(StrictModel):
    type: Literal["grid"] = "grid"
    inputKey: str = Field(default="grid", min_length=1, max_length=40)
    layout: GridLayout = "isometric"


class ArrayStructureSpec(StrictModel):
    type: Literal["array"] = "array"
    inputKey: str = Field(default="nums", min_length=1, max_length=40)
    layout: ArrayLayout = "horizontal"
    showIndices: bool = True


class LinkedListStructureSpec(StrictModel):
    type: Literal["linked_list"] = "linked_list"
    inputKey: str = Field(default="head", min_length=1, max_length=40)
    layout: LinkedListLayout = "horizontal_train"


class BinaryTreeStructureSpec(StrictModel):
    type: Literal["binary_tree"] = "binary_tree"
    inputKey: str = Field(default="root", min_length=1, max_length=40)
    layout: BinaryTreeLayout = "layered"


class GraphStructureSpec(StrictModel):
    type: Literal["graph"] = "graph"
    inputKey: str = Field(default="numCourses", min_length=1, max_length=40)
    layout: GraphLayout = "circle"


StructureSpec = Annotated[
    GridStructureSpec
    | ArrayStructureSpec
    | LinkedListStructureSpec
    | BinaryTreeStructureSpec
    | GraphStructureSpec,
    Field(discriminator="type"),
]


class ParsedStructureSpec(StrictModel):
    """Flat structure for OpenAI structured outputs (no oneOf/discriminator)."""

    type: SceneType
    inputKey: str = Field(default="grid", min_length=1, max_length=40)
    layout: str = Field(default="isometric", min_length=1, max_length=40)
    showIndices: bool = True


def coerce_structure(
    parsed: ParsedStructureSpec,
) -> (
    GridStructureSpec
    | ArrayStructureSpec
    | LinkedListStructureSpec
    | BinaryTreeStructureSpec
    | GraphStructureSpec
):
    if parsed.type == "array":
        layout: ArrayLayout = (
            parsed.layout  # type: ignore[assignment]
            if parsed.layout in ("horizontal", "bars", "window")
            else "horizontal"
        )
        return ArrayStructureSpec(
            type="array",
            inputKey=parsed.inputKey or "nums",
            layout=layout,
            showIndices=parsed.showIndices,
        )
    if parsed.type == "linked_list":
        return LinkedListStructureSpec(
            type="linked_list",
            inputKey=parsed.inputKey or "head",
            layout="horizontal_train",
        )
    if parsed.type == "binary_tree":
        return BinaryTreeStructureSpec(
            type="binary_tree",
            inputKey=parsed.inputKey or "root",
            layout="layered",
        )
    if parsed.type == "graph":
        return GraphStructureSpec(
            type="graph",
            inputKey=parsed.inputKey or "numCourses",
            layout="circle",
        )
    grid_layout: GridLayout = (
        parsed.layout  # type: ignore[assignment]
        if parsed.layout in ("top_down", "isometric")
        else "isometric"
    )
    return GridStructureSpec(
        type="grid",
        inputKey=parsed.inputKey or "grid",
        layout=grid_layout,
    )


class ThemeSpec(StrictModel):
    """Artistic presentation — separate from data-structure topology."""

    preset: WorldPreset
    name: str = Field(min_length=1, max_length=120)
    palette: PaletteSpec
    camera: CameraConfig
    props: list[WorldProp] = Field(default_factory=list, max_length=12)
    timeSystem: TimeSystemSpec = Field(
        default_factory=lambda: TimeSystemSpec(mode="static", advanceOn="none")
    )


class WorldSpec(StrictModel):
    """Legacy combined world block — kept for migration of old animation.json."""

    preset: WorldPreset
    theme: str = Field(min_length=1, max_length=120)
    sceneType: SceneType = "grid"
    palette: PaletteSpec
    camera: CameraConfig
    props: list[WorldProp] = Field(default_factory=list, max_length=12)
    timeSystem: TimeSystemSpec = Field(
        default_factory=lambda: TimeSystemSpec(mode="static", advanceOn="none")
    )


class EntityDefinition(StrictModel):
    primitive: PrimitiveType
    variant: str = Field(min_length=1, max_length=60)
    color: str
    label: str
    idleAnimation: IdleAnimation
    expression: str | None = None


class EventAnimation(StrictModel):
    effect: AnimationEffect
    durationMs: int = Field(ge=100, le=3000)
    color: str | None
    explanation: str = Field(min_length=1, max_length=240)
    targetReaction: EntityReaction | None = None
    camera: Literal["none", "brief_focus", "shake"] | None = None


class ResultReaction(StrictModel):
    effect: AnimationEffect
    entityReaction: EntityReaction = "none"
    explanation: str = Field(min_length=1, max_length=240)


class ResultChoreography(StrictModel):
    success: ResultReaction
    failure: ResultReaction


class IntroAction(StrictModel):
    action: IntroActionType
    durationMs: int = Field(ge=100, le=3000)
    text: str | None


class StateBinding(StrictModel):
    """Maps an observed cell/element value to a semantic key + entity type."""

    value: str = Field(min_length=1, max_length=40)
    semanticKey: str = Field(min_length=1, max_length=60)
    label: str = Field(min_length=1, max_length=80)
    entityType: PrimitiveType


class ProblemSemanticSpec(StrictModel):
    sceneType: SceneType = "grid"
    inputKey: str = Field(default="grid", min_length=1, max_length=40)
    bindings: list[StateBinding] = Field(min_length=1, max_length=40)


class EntityBinding(StrictModel):
    """LLM-friendly list item; converted to a dict keyed by semanticKey."""

    semanticKey: str = Field(min_length=1, max_length=60)
    entity: EntityDefinition


class EventBinding(StrictModel):
    """LLM-friendly list item; converted to a dict for the frontend."""

    eventType: str = Field(min_length=1, max_length=60)
    animation: EventAnimation


class ParsedVisualPlan(StrictModel):
    """Structured-output shape for OpenAI (lists, not open-ended dicts)."""

    structure: ParsedStructureSpec
    theme: ThemeSpec
    entities: list[EntityBinding] = Field(min_length=1, max_length=20)
    eventBindings: list[EventBinding] = Field(min_length=1, max_length=40)
    resultChoreography: ResultChoreography
    intro: list[IntroAction] = Field(min_length=1, max_length=8)


class ParsedProblemBundle(StrictModel):
    """One GPT response: semantic interpretation + visual plan."""

    semanticSpec: ProblemSemanticSpec
    visualPlan: ParsedVisualPlan


class GeneratedVisualPlan(BaseModel):
    structure: StructureSpec
    theme: ThemeSpec
    entities: dict[str, EntityDefinition]
    eventBindings: dict[str, EventAnimation]
    resultChoreography: ResultChoreography
    intro: list[IntroAction]

    @property
    def world(self) -> WorldSpec:
        """Compat view for code still reading plan.world."""

        return WorldSpec(
            preset=self.theme.preset,
            theme=self.theme.name,
            sceneType=self.structure.type,  # type: ignore[arg-type]
            palette=self.theme.palette,
            camera=self.theme.camera,
            props=self.theme.props,
            timeSystem=self.theme.timeSystem,
        )


class GeneratedProblemBundle(BaseModel):
    problemId: str
    semanticSpec: ProblemSemanticSpec
    visualPlan: GeneratedVisualPlan


class ObservedTraceSchema(BaseModel):
    structureType: SceneType = "grid"
    cellValues: list[str] = Field(default_factory=list)
    eventTypes: list[str] = Field(default_factory=list)


class PublicationRecord(BaseModel):
    status: Literal["draft", "published", "generation_failed"] = "draft"
    generatedAt: str | None = None
    generatorVersion: str = "1"
    errors: list[str] = Field(default_factory=list)


class AnimationPackage(BaseModel):
    """Internal/tooling package (generate-animation, CLI)."""

    problemId: str
    runMode: RunMode
    execution: ExecutionResult
    visualPlan: GeneratedVisualPlan
    semanticSpec: ProblemSemanticSpec | None = None


class ClientAnimationPackage(BaseModel):
    """Page-load package: facts + presentation + static initial state (no execution)."""

    problem: ProblemFacts
    visualPlan: GeneratedVisualPlan
    semanticSpec: ProblemSemanticSpec | None = None
    initialState: dict[str, Any]


class BuildProblemRequest(BaseModel):
    style: str = "derpy"
    force: bool = False
    exampleIndex: int | None = None


class BuildProblemResponse(BaseModel):
    problemId: str
    status: Literal["published", "validation_failed", "draft"]
    package: ClientAnimationPackage | None = None
    errors: list[str] = Field(default_factory=list)


# Backward-compatible alias used by older imports / CLI.
BuildResponse = BuildProblemResponse
