# ADR-0001: Learning Content Hierarchy

**Status:** Accepted

**Date:** 2026-07-12

## Context

The Learning app needed a scalable content hierarchy to support progressive education across 8 learning zones (Mobile Money Safety, Phishing Awareness, etc.). The original flat design — `Zone → Lesson` — lacked a grouping level between zones and individual lessons, making it difficult to organize multi-week curricula.

Additionally, we needed models for gamification (XP tracking, badges, streaks) and daily engagement (daily tips), and the architecture needed a consistent split between view logic (`apps/learning/`) and business logic (`services/learning/`).

## Decision

Adopt the hierarchy: **Zone → LearningModule → Lesson → LessonPart**

- **Zone** — thematic area (e.g. "Phishing Awareness"), with XP unlock threshold.
- **LearningModule** — a unit within a zone (e.g. "Week 1: Recognizing Phishing Emails").
- **Lesson** — single educational content item within a module.
- **LessonPart** — sub-section of a lesson (text, quiz, video, interactive).

Supporting models:
- **LessonProgress** — user completion tracking (same as before, no change).
- **XPTransaction** — immutable audit log of all XP awards.
- **Badge / UserBadge** — badge definitions and user awards.
- **Streak** — daily learning streak tracking.
- **DailyTip** — curated daily safety tips.

All business logic lives in `services/learning/` (lesson_progress.py, xp.py, badges.py). All read queries live in `apps/learning/selectors.py`. Models are split into a `models/` package with one file per model class.

## Consequences

**Positive:**
- Clean separation of concerns: views → selectors/services.
- Hierarchical navigation maps naturally to REST API endpoints.
- Gamification models are designed upfront, avoiding later disruption.
- `models/` package prevents a single monolithic models.py.

**Negative:**
- Existing data with the old `Zone → Lesson` schema must be migrated.
- Tests, admin, serializers, and views needed updating.

**Trade-offs:**
- Chose `LearningModule` over a simpler "section" or "chapter" naming to align with future content import/export features. Module is the unit of content that gets versioned.
- Kept `LessonProgress` flat (no per-part progress) for simplicity — acceptable for MVP scope.
