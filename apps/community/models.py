from django.conf import settings
from django.db import models

from shared.models.base import BaseModel
from shared.constants.community import CommunityPostType, ModerationStatus


class CommunityPost(BaseModel):
    """
    Community feed containing:
    - System-generated Alerts (from approved incident reports)
    - Citizen-submitted Tips

    FR-COM-03
    """

    type = models.CharField(
        max_length=10,
        choices=CommunityPostType.CHOICES,
        db_index=True,
    )

    source_report = models.ForeignKey(
        "incidents.Incident",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="community_alerts",
        help_text="Approved incident that generated this alert.",
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="community_posts",
        help_text="Null for system-generated alerts.",
    )

    content = models.TextField()

    media_url = models.URLField(blank=True)

    tags = models.JSONField(
        default=list,
        blank=True,
        help_text='Example: ["Scam", "Safety", "Fraud"]',
    )

    moderation_status = models.CharField(
        max_length=20,
        choices=ModerationStatus.CHOICES,
        default=ModerationStatus.PENDING,
        db_index=True,
    )

    moderation_reason = models.TextField(blank=True)

    moderated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="moderated_community_posts",
    )

    # Cached counters
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    reports_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "community_posts"
        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["moderation_status", "created_at"]),
            models.Index(fields=["type"]),
            models.Index(fields=["author"]),
        ]

    def __str__(self):
        return f"{self.get_type_display()} ({self.pk})"

    @property
    def is_visible(self):
        return self.moderation_status in ModerationStatus.VISIBLE_STATUSES

    @property
    def is_author_verified(self):
        return bool(self.author and getattr(self.author, "is_verified", False))


class CommunityComment(BaseModel):
    """
    Comments on community posts.
    """

    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name="comments",
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="community_comments",
    )

    content = models.TextField()

    class Meta:
        db_table = "community_comments"
        ordering = ["created_at"]

        indexes = [
            models.Index(fields=["post"]),
        ]

    def __str__(self):
        return f"Comment #{self.pk}"


class CommunityLike(BaseModel):
    """
    One like per user per post.
    """

    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name="likes",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="community_likes",
    )

    class Meta:
        db_table = "community_likes"

        constraints = [
            models.UniqueConstraint(
                fields=["post", "user"],
                name="unique_like_per_user_per_post",
            )
        ]

        indexes = [
            models.Index(fields=["post"]),
        ]

    def __str__(self):
        return f"Like #{self.pk}"


class CommunityContentReport(BaseModel):
    """
    User reports inappropriate community content.
    FR-COM-06
    """

    STATUS_PENDING = "pending"
    STATUS_REVIEWED = "reviewed"
    STATUS_DISMISSED = "dismissed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_REVIEWED, "Reviewed"),
        (STATUS_DISMISSED, "Dismissed"),
    ]

    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name="content_reports",
    )

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="content_reports_filed",
    )

    reason = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_content_reports",
    )

    class Meta:
        db_table = "community_content_reports"

        constraints = [
            models.UniqueConstraint(
                fields=["post", "reporter"],
                name="unique_report_per_user",
            )
        ]

        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["post"]),
        ]

    def __str__(self):
        return f"Report #{self.pk} - {self.status}"
