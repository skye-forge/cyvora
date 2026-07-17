import pytest

from apps.quizzes.models import QuizAttempt
from apps.quizzes.services import QuizGradingError, submit_quiz_attempt

pytestmark = pytest.mark.django_db


def test_submit_quiz_attempt_passes_when_score_meets_threshold(
    user_factory, quiz_with_two_questions_factory
):
    user = user_factory()
    quiz, questions = quiz_with_two_questions_factory(pass_score_percent=50)

    correct_option_q1 = questions[0].options.get(is_correct=True)
    correct_option_q2 = questions[1].options.get(is_correct=True)

    attempt = submit_quiz_attempt(
        user=user,
        quiz=quiz,
        answers=[
            {"question_id": str(questions[0].id), "option_id": str(correct_option_q1.id)},
            {"question_id": str(questions[1].id), "option_id": str(correct_option_q2.id)},
        ],
    )

    assert attempt.passed is True
    assert attempt.score_percent == 100
    assert attempt.points_awarded == 50
    assert QuizAttempt.objects.filter(user=user, quiz=quiz).count() == 1


def test_submit_quiz_attempt_rejects_missing_answers(
    user_factory, quiz_with_two_questions_factory
):
    user = user_factory()
    quiz, questions = quiz_with_two_questions_factory()
    only_option = questions[0].options.first()

    with pytest.raises(QuizGradingError):
        submit_quiz_attempt(
            user=user,
            quiz=quiz,
            answers=[
                {"question_id": str(questions[0].id), "option_id": str(only_option.id)},
            ],
        )


def test_submit_quiz_attempt_fails_below_threshold(
    user_factory, quiz_with_two_questions_factory
):
    user = user_factory()
    quiz, questions = quiz_with_two_questions_factory(pass_score_percent=100)

    wrong_option_q1 = questions[0].options.get(is_correct=False)
    correct_option_q2 = questions[1].options.get(is_correct=True)

    attempt = submit_quiz_attempt(
        user=user,
        quiz=quiz,
        answers=[
            {"question_id": str(questions[0].id), "option_id": str(wrong_option_q1.id)},
            {"question_id": str(questions[1].id), "option_id": str(correct_option_q2.id)},
        ],
    )

    assert attempt.passed is False
    assert attempt.points_awarded == 0
