from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SupportTicket, TicketStatus
from .permissions import IsSupportAgent, IsTicketOwnerOrAssignedAgent
from .serializers import (
    SupportTicketCreateSerializer,
    SupportTicketDetailSerializer,
    SupportTicketSerializer,
)
from .services import assign_agent, close_ticket, create_ticket


class TicketListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/support/tickets/   -> citizen's own tickets
    POST /api/support/tickets/   -> create a new ticket (with first message)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SupportTicketCreateSerializer
        return SupportTicketSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ticket = create_ticket(
            user=request.user,
            subject=data.get("subject", ""),
            category=data["category"],
            first_message=data["message"],
            attachment_url=data.get("attachment_url"),
        )

        # Kick off AI triage on the first message too, same as any other
        # citizen message — imported locally to avoid a circular import
        # between views and tasks at module load time.
        from .tasks import run_ai_triage_task

        first_message = ticket.messages.first()
        run_ai_triage_task.delay(str(ticket.id), str(first_message.id))

        output = SupportTicketDetailSerializer(ticket)
        return Response(output.data, status=status.HTTP_201_CREATED)


class TicketDetailView(generics.RetrieveAPIView):
    """GET /api/support/tickets/{id}/  -> ticket + full message history (for reconnect/scroll-back)."""

    serializer_class = SupportTicketDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsTicketOwnerOrAssignedAgent]
    queryset = SupportTicket.objects.all()
    lookup_field = "id"
    lookup_url_kwarg = "ticket_id"


class TicketMessagesView(generics.RetrieveAPIView):
    """GET /api/support/tickets/{id}/messages/  -> messages only, paginated-friendly, for scroll-back."""

    serializer_class = SupportTicketDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsTicketOwnerOrAssignedAgent]
    queryset = SupportTicket.objects.all()
    lookup_field = "id"
    lookup_url_kwarg = "ticket_id"


class TicketCloseView(APIView):
    """PATCH /api/support/tickets/{id}/close/  -> citizen or agent closes the ticket."""

    permission_classes = [permissions.IsAuthenticated, IsTicketOwnerOrAssignedAgent]

    def patch(self, request, ticket_id):
        ticket = get_object_or_404(SupportTicket, id=ticket_id)
        self.check_object_permissions(request, ticket)
        ticket = close_ticket(ticket)
        return Response(SupportTicketSerializer(ticket).data)


class AgentQueueView(generics.ListAPIView):
    """GET /api/support/agents/queue/  -> tickets escalated to a human, unassigned."""

    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupportAgent]

    def get_queryset(self):
        return SupportTicket.objects.filter(
            status=TicketStatus.OPEN,
            auto_handled=False,
            assigned_agent__isnull=True,
        )


class TicketAssignView(APIView):
    """PATCH /api/support/tickets/{id}/assign/  -> agent claims a ticket."""

    permission_classes = [permissions.IsAuthenticated, IsSupportAgent]

    def patch(self, request, ticket_id):
        ticket = get_object_or_404(SupportTicket, id=ticket_id)

        if ticket.assigned_agent_id and ticket.assigned_agent_id != request.user.id:
            return Response(
                {"detail": "Ticket already assigned to another agent."},
                status=status.HTTP_409_CONFLICT,
            )

        ticket = assign_agent(ticket, request.user)
        return Response(SupportTicketSerializer(ticket).data)
