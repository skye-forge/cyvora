from django.conf import settings
from django.db import models

from shared.models.base import BaseModel


class Quiz(BaseModel):
    """
    Knowledge-check tied to a Course (FR-LRN-08).
    One quiz per course track; passing it marks the track complete
    and unlocks Certification eligibility (FR-CERT-01).
    """

    course = models.OneToOneField(
        "learning.Course", on_delete=models.CASCADE, related_name="quiz"
    )
    title = models.CharField(max_length=150)
    pass_score_percent = models.PositiveSmallIntegerField(default=70)
    time_limit_seconds = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "quizzes"

    def __str__(self):
        return f"Quiz: {self.title}"


class Question(BaseModel):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    text_en = models.TextField()
    text_fr = models.TextField()
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "quiz_questions"
        ordering = ["order"]

    def __str__(self):
        return self.text_en[:50]


class Option(BaseModel):
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="options"
    )
    text_en = models.CharField(max_length=255)
    text_fr = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "quiz_options"
        ordering = ["order"]


class QuizAttempt(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quiz_attempts"
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    score_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    passed = models.BooleanField(default=False)
    points_awarded = models.PositiveIntegerField(default=0)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "quiz_attempts"
        ordering = ["-created_at"]


class QuizAnswer(BaseModel):
    attempt = models.ForeignKey(
        QuizAttempt, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(Option, on_delete=models.CASCADE)
    is_correct = models.BooleanField(default=False)

    class Meta:
        db_table = "quiz_answers"
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "question"],
                name="unique_answer_per_question_per_attempt",
            )
        ]
