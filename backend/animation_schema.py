from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


SceneType = Literal["grid", "height_map"]
CameraMode = Literal["top_down", "isometric", "follow"]

PrimitiveType = Literal[
    "empty_tile",
    "floor_tile",
    "orange",
    "land",
    "water",
    "wall",
    "character",
    "destination",
    "height_block",
]

IdleAnimation = Literal[
    "none",
    "gentle_bounce",
    "gentle_float",
    "sick_wobble",
    "water_ripple",
    "soft_glow",
]

AnimationEffect = Literal[
    "none",
    "cell_pulse",
    "queue_glow",
    "infection_wave",
    "transform_entity",
    "island_discovery",
    "frontier_expand",
    "path_reveal",
    "water_flow",
    "dual_ocean_glow",
    "result_reveal",
]

IntroActionType = Literal[
    "show_grid",
    "camera_pan",
    "show_title",
    "highlight_sources",
    "highlight_destination",
]


class StrictModel(BaseModel):
    """OpenAI structured outputs require additionalProperties=false and every
    property listed in `required` (including nullable fields).
    """

    model_config = ConfigDict(extra="forbid")


class CameraConfig(StrictModel):
    mode: CameraMode
    position: list[float] = Field(min_length=3, max_length=3)
    target: list[float] = Field(min_length=3, max_length=3)


class SceneConfig(StrictModel):
    type: SceneType
    theme: str = Field(min_length=1, max_length=80)
    background_color: str
    camera: CameraConfig


class EntityDefinition(StrictModel):
    primitive: PrimitiveType
    variant: str = Field(min_length=1, max_length=60)
    color: str
    label: str
    idle_animation: IdleAnimation


class EventAnimation(StrictModel):
    effect: AnimationEffect
    duration_ms: int = Field(ge=100, le=3000)
    color: str | None
    explanation: str = Field(min_length=1, max_length=240)


class IntroAction(StrictModel):
    action: IntroActionType
    duration_ms: int = Field(ge=100, le=3000)
    text: str | None


class EntityBinding(StrictModel):
    """Maps a config.scene.cellMapping key (e.g. \"0\") to a visual entity."""

    cell_value: str = Field(min_length=1, max_length=40)
    entity: EntityDefinition


class EventBinding(StrictModel):
    """Maps a verified trace event type to a presentation effect."""

    event_type: str = Field(min_length=1, max_length=60)
    animation: EventAnimation


class AnimationPlan(StrictModel):
    version: Literal[1]
    problem_id: str
    title: str = Field(min_length=1, max_length=100)
    scene: SceneConfig
    entities: list[EntityBinding] = Field(min_length=1, max_length=20)
    event_bindings: list[EventBinding] = Field(min_length=1, max_length=40)
    intro: list[IntroAction] = Field(min_length=1, max_length=8)
    educational_notes: list[str] = Field(min_length=1, max_length=8)

    def entity_map(self) -> dict[str, EntityDefinition]:
        return {item.cell_value: item.entity for item in self.entities}

    def event_map(self) -> dict[str, EventAnimation]:
        return {item.event_type: item.animation for item in self.event_bindings}
