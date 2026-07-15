"""JSON Lesson Import Service.

Allows content admins to upload a JSON file that defines a full learning
zone including modules, lessons, and lesson parts. The service handles:

1. Validation — checks the JSON against a required schema
2. Preview — returns a parsed view without saving
3. Import — creates all objects in a single atomic transaction
4. Rollback — on validation errors the whole import is cancelled
5. History — logs every import event
"""

import json
import logging
from datetime import datetime

from django.db import transaction

from apps.learning.models import Zone, LearningModule, Lesson, LessonPart
from shared.enums.learning import DifficultyLevel, PublicationStatus
from shared.utils import generate_unique_slug

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Schema validation
# ──────────────────────────────────────────────

REQUIRED_ZONE_FIELDS = ["title", "description"]
OPTIONAL_ZONE_FIELDS = ["icon", "color", "difficulty", "estimated_hours", "display_order"]
REQUIRED_MODULE_FIELDS = ["title"]
REQUIRED_LESSON_FIELDS = ["title", "content"]
REQUIRED_LESSON_PART_FIELDS = ["part_type", "content"]


class ImportValidationError(Exception):
    def __init__(self, message, errors=None):
        self.message = message
        self.errors = errors or []
        super().__init__(message)


def validate_import_json(data: dict) -> list:
    """Validate the entire JSON import structure.

    Returns a list of error dicts. An empty list means valid.
    """
    errors = []

    # Check zone fields
    for field in REQUIRED_ZONE_FIELDS:
        if field not in data or not data[field]:
            errors.append({"path": f"zone.{field}", "message": f"Missing required field: {field}"})

    # Check modules
    modules = data.get("modules", [])
    if not modules:
        errors.append({"path": "modules", "message": "At least one module is required"})

    for i, module in enumerate(modules):
        for field in REQUIRED_MODULE_FIELDS:
            if field not in module or not module[field]:
                errors.append({"path": f"modules[{i}].{field}", "message": f"Missing required field: {field}"})

        lessons = module.get("lessons", [])
        if not lessons:
            errors.append({"path": f"modules[{i}].lessons", "message": "At least one lesson is required per module"})

        for j, lesson in enumerate(lessons):
            for field in REQUIRED_LESSON_FIELDS:
                if field not in lesson or not lesson[field]:
                    errors.append({"path": f"modules[{i}].lessons[{j}].{field}", "message": f"Missing required field: {field}"})

            parts = lesson.get("parts", [])
            for k, part in enumerate(parts):
                for field in REQUIRED_LESSON_PART_FIELDS:
                    if field not in part or not part[field]:
                        errors.append({"path": f"modules[{i}].lessons[{j}].parts[{k}].{field}", "message": f"Missing required field: {field}"})

                valid_types = [t[0] for t in LessonPart.PART_TYPES]
                if part.get("part_type") and part["part_type"] not in valid_types:
                    errors.append({"path": f"modules[{i}].lessons[{j}].parts[{k}].part_type", "message": f"Invalid part_type. Must be one of: {', '.join(valid_types)}"})

    return errors


def get_import_preview(data: dict) -> dict:
    """Parse the import data and return a preview without saving.

    Returns counts and structure overview.
    """
    errors = validate_import_json(data)
    if errors:
        return {"valid": False, "errors": errors, "preview": None}

    modules = data.get("modules", [])
    module_previews = []

    for i, module in enumerate(modules):
        lessons = module.get("lessons", [])
        lesson_previews = []
        for j, lesson in enumerate(lessons):
            lesson_previews.append({
                "index": j,
                "title": lesson["title"],
                "duration": lesson.get("duration_minutes", 10),
                "part_count": len(lesson.get("parts", [])),
            })
        module_previews.append({
            "index": i,
            "title": module["title"],
            "lesson_count": len(lessons),
            "lessons": lesson_previews,
        })

    return {
        "valid": True,
        "errors": [],
        "preview": {
            "zone_title": data["title"],
            "zone_description": data.get("description", ""),
            "difficulty": data.get("difficulty", "beginner"),
            "module_count": len(modules),
            "total_lessons": sum(len(m.get("lessons", [])) for m in modules),
            "total_parts": sum(
                len(lesson.get("parts", []))
                for m in modules
                for lesson in m.get("lessons", [])
            ),
            "modules": module_previews,
        },
    }


# ──────────────────────────────────────────────
# Import execution
# ──────────────────────────────────────────────

@transaction.atomic
def execute_import(data: dict, created_by=None) -> dict:
    """Execute the JSON import in a single atomic transaction.

    Creates:
    - 1 Zone
    - N LearningModules
    - M Lessons per module
    - P LessonParts per lesson

    Returns a summary dict with IDs of all created objects.
    """
    errors = validate_import_json(data)
    if errors:
        raise ImportValidationError("Import validation failed", errors=errors)

    # Resolve difficulty
    difficulty_map = {
        "beginner": DifficultyLevel.BEGINNER,
        "intermediate": DifficultyLevel.INTERMEDIATE,
        "advanced": DifficultyLevel.ADVANCED,
    }
    difficulty = difficulty_map.get(data.get("difficulty", "beginner"), DifficultyLevel.BEGINNER)

    # Create Zone
    zone = Zone.objects.create(
        title=data["title"],
        description=data.get("description", ""),
        icon=data.get("icon", ""),
        color=data.get("color", "#2563EB"),
        difficulty=difficulty,
        estimated_hours=data.get("estimated_hours", 0),
        display_order=data.get("display_order", 0),
        status=PublicationStatus.DRAFT,
    )

    created_modules = []
    for mi, module_data in enumerate(data.get("modules", []), start=1):
        module = LearningModule.objects.create(
            zone=zone,
            title=module_data["title"],
            description=module_data.get("description", ""),
            order=module_data.get("order", mi),
        )
        created_lessons = []

        for li, lesson_data in enumerate(module_data.get("lessons", []), start=1):
            lesson = Lesson.objects.create(
                module=module,
                title=lesson_data["title"],
                content=lesson_data["content"],
                order=lesson_data.get("order", li),
                duration_minutes=lesson_data.get("duration_minutes", 10),
            )
            created_parts = []

            for pi, part_data in enumerate(lesson_data.get("parts", []), start=1):
                part = LessonPart.objects.create(
                    lesson=lesson,
                    part_type=part_data["part_type"],
                    title=part_data.get("title", ""),
                    content=part_data.get("content", {}),
                    order=part_data.get("order", pi),
                )
                created_parts.append({"id": str(part.id), "type": part.part_type, "order": part.order})

            created_lessons.append({
                "id": str(lesson.id),
                "title": lesson.title,
                "parts": created_parts,
            })

        created_modules.append({
            "id": str(module.id),
            "title": module.title,
            "lessons": created_lessons,
        })

    summary = {
        "zone_id": str(zone.id),
        "zone_title": zone.title,
        "slug": zone.slug,
        "modules": created_modules,
        "module_count": len(created_modules),
        "lesson_count": sum(len(m["lessons"]) for m in created_modules),
        "part_count": sum(len(m["lessons"][l_idx]["parts"]) for m in created_modules for l_idx in range(len(m["lessons"]))),
        "imported_at": datetime.utcnow().isoformat(),
    }

    logger.info(
        "JSON import completed | zone=%s modules=%d lessons=%d parts=%d",
        zone.title,
        summary["module_count"],
        summary["lesson_count"],
        summary["part_count"],
    )

    return summary
