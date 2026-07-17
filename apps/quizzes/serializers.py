from rest_framework import serializers

from .models import Option, Question, Quiz, QuizAnswer, QuizAttempt


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        # is_correct deliberately excluded — never sent to the client pre-grading
        fields = ["id", "text_en", "text_fr", "order"]


class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text_en", "text_fr", "order", "options"]


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id", "course", "title", "pass_score_percent",
            "time_limit_seconds", "questions",
        ]


class QuizAnswerInputSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    option_id = serializers.UUIDField()

    def to_internal_value(self, data):
        validated = super().to_internal_value(data)
        return {
            "question_id": str(validated["question_id"]),
            "option_id": str(validated["option_id"]),
        }


class QuizSubmitSerializer(serializers.Serializer):
    answers = QuizAnswerInputSerializer(many=True)

    def validate_answers(self, value):
        if not value:
            raise serializers.ValidationError("At least one answer is required.")
        return value


class QuizAnswerResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAnswer
        fields = ["question", "selected_option", "is_correct"]


class QuizAttemptResultSerializer(serializers.ModelSerializer):
    answers = QuizAnswerResultSerializer(many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            "id", "quiz", "score_percent", "passed",
            "points_awarded", "started_at", "submitted_at", "answers",
        ]
