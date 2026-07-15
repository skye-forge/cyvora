from django.urls import path
from . import views

app_name = "national_updates"

urlpatterns = [
    path("", views.NationalUpdateListView.as_view(), name="update-list"),
    path("<uuid:pk>", views.NationalUpdateDetailView.as_view(), name="update-detail"),
]
