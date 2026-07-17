from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from shared.mixins.audit_loggable import log_audit_action

from .models import Option, Question, QuizAnswer, QuizAttempt

# Gamification Scoring Model (Appendix 7.2)
POINTS_PER_QUIZ_PASS = 50


class QuizGradingError(ValidationError):
    pass


@transaction.atomic
def submit_quiz_attempt(*, user, quiz, answers: list[dict]) -> QuizAttempt:
    """
    answers: [{"question_id": <uuid>, "option_id": <uuid>}, ...]

    Grades the attempt, persists per-question answers, awards points on
    pass (Appendix 7.2), and returns the completed QuizAttempt.
    """
    questions = list(quiz.questions.prefetch_related("options"))
    if not questions:
        raise QuizGradingError("This quiz has no questions configured.")

    question_ids = {str(q.id) for q in questions}
    submitted_ids = {a["question_id"] for a in answers}
    if question_ids != submitted_ids:
        raise QuizGradingError("You must answer every question exactly once.")

    attempt = QuizAttempt.objects.create(user=user, quiz=quiz)

    questions_by_id = {str(q.id): q for q in questions}
    correct_count = 0

    for answer in answers:
        question = questions_by_id[answer["question_id"]]
        try:
            option = next(
                o for o in question.options.all() if str(o.id) == answer["option_id"]
            )
        except StopIteration:
            raise QuizGradingError(
                f"Option {answer['option_id']} does not belong to question {question.id}."
            )

        is_correct = option.is_correct
        if is_correct:
            correct_count += 1

        QuizAnswer.objects.create(
            attempt=attempt,
            question=question,
            selected_option=option,
            is_correct=is_correct,
        )

    score_percent = (Decimal(correct_count) / Decimal(len(questions)) * 100).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    passed = score_percent >= quiz.pass_score_percent

    attempt.score_percent = score_percent
    attempt.passed = passed
    attempt.points_awarded = POINTS_PER_QUIZ_PASS if passed else 0
    attempt.submitted_at = timezone.now()
    attempt.save(
        update_fields=["score_percent", "passed", "points_awarded", "submitted_at"]
    )

    log_audit_action(
        user,
        "quiz.attempt_submitted",
        attempt,
        {
            "quiz_id": str(quiz.id),
            "score_percent": str(score_percent),
            "passed": passed,
        },
    )

    if passed:
        _mark_course_complete_and_award_points(
            user=user, quiz=quiz, points=POINTS_PER_QUIZ_PASS
        )

    return attempt


def _mark_course_complete_and_award_points(*, user, quiz, points):
    """
    Delegates to the learning app's progress service so quizzes stays
    decoupled from course/streak/level internals (FR-LRN-02, FR-LRN-04).
    """
    from apps.learning.services import complete_course_track

    complete_course_track(user=user, course=quiz.course, bonus_points=points)
