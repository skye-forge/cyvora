from django.urls import path

from . import views

app_name = "support"

urlpatterns = [
    path("tickets/", views.TicketListCreateView.as_view(), name="ticket-list-create"),
    path("tickets/<uuid:ticket_id>/", views.TicketDetailView.as_view(), name="ticket-detail"),
    path("tickets/<uuid:ticket_id>/messages/", views.TicketMessagesView.as_view(), name="ticket-messages"),
    path("tickets/<uuid:ticket_id>/close/", views.TicketCloseView.as_view(), name="ticket-close"),
    path("tickets/<uuid:ticket_id>/assign/", views.TicketAssignView.as_view(), name="ticket-assign"),
    path("agents/queue/", views.AgentQueueView.as_view(), name="agent-queue"),
]
