from django.db import models


class OrderedModel(models.Model):
    """
    Adds manual ordering support.
    """

    display_order = models.PositiveIntegerField(
        default=0,
        db_index=True,
    )

    class Meta:
        abstract = True
