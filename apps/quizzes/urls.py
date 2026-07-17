from django.urls import path

from .views import QuizDetailView, QuizSubmitView

app_name = "quizzes"

urlpatterns = [
    path("<uuid:quiz_id>/", QuizDetailView.as_view(), name="quiz-detail"),
    path("<uuid:quiz_id>/submit/", QuizSubmitView.as_view(), name="quiz-submit"),
]
