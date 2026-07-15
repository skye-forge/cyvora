from django.db import models


class PublicationStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    REVIEW = "review", "In Review"
    PUBLISHED = "published", "Published"
    ARCHIVED = "archived", "Archived"


class DifficultyLevel(models.TextChoices):
    BEGINNER = "beginner", "Beginner"
    INTERMEDIATE = "intermediate", "Intermediate"
    ADVANCED = "advanced", "Advanced"


class LessonPartType(models.TextChoices):
    HEADING = "heading", "Heading"
    PARAGRAPH = "paragraph", "Paragraph"
    IMAGE = "image", "Image"
    VIDEO = "video", "Video"
    TIP = "tip", "Tip"
    WARNING = "warning", "Warning"
    QUOTE = "quote", "Quote"
    LINK = "link", "Link"
    DOWNLOAD = "download", "Download"
