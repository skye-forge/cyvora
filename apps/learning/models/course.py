from django.db import models

from shared.models.base import BaseModel


class Course(BaseModel):
    """
    A course track or learning pathway that can have an associated quiz.
    Groups learning content into a structured course unit.
    """

    title = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "courses"
        ordering = ["title"]

    def __str__(self):
        return self.title
