from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Quiz
from .serializers import (
    QuizAttemptResultSerializer,
    QuizSerializer,
    QuizSubmitSerializer,
)
from .services import submit_quiz_attempt


class QuizDetailView(RetrieveAPIView):
    """GET /api/quizzes/{quiz_id}/ — questions without correct answers."""
    queryset = Quiz.objects.filter(is_active=True).prefetch_related("questions__options")
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = "quiz_id"


class QuizSubmitView(APIView):
    """POST /api/quizzes/{quiz_id}/submit/ — grade and record an attempt."""
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(Quiz.objects.filter(is_active=True), pk=quiz_id)

        input_serializer = QuizSubmitSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        attempt = submit_quiz_attempt(
            user=request.user,
            quiz=quiz,
            answers=input_serializer.validated_data["answers"],
        )

        result = QuizAttemptResultSerializer(attempt)
        return Response(result.data, status=status.HTTP_201_CREATED)
