from django.urls import path

from .views import IncidentDetailView, IncidentListCreateView, ModerateIncidentView

app_name = "incidents"

urlpatterns = [
    path("", IncidentListCreateView.as_view(), name="list-create"),
    path("<uuid:incident_id>/", IncidentDetailView.as_view(), name="detail"),
    path("<uuid:incident_id>/moderate/", ModerateIncidentView.as_view(), name="moderate"),
]
