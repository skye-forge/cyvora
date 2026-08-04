import pytest
from django.contrib.auth import get_user_model

from apps.support.models import SenderRole, SupportTicket, TicketStatus
from apps.support.services import create_ticket, escalate_ticket, save_and_broadcast

User = get_user_model()


@pytest.mark.django_db
def test_create_ticket_creates_first_message():
    user = User.objects.create_user(username="citizen1", password="x")
    ticket = create_ticket(
        user=user, subject="", category="technical", first_message="App keeps crashing"
    )

    assert ticket.status == TicketStatus.OPEN
    assert ticket.auto_handled is True
    assert ticket.messages.count() == 1
    assert ticket.messages.first().sender_role == SenderRole.CITIZEN


@pytest.mark.django_db
def test_escalate_ticket_flips_auto_handled_and_posts_system_message():
    user = User.objects.create_user(username="citizen2", password="x")
    ticket = create_ticket(
        user=user, subject="", category="general", first_message="I need help with a report"
    )

    escalate_ticket(ticket, reason="Low AI confidence")
    ticket.refresh_from_db()

    assert ticket.auto_handled is False
    assert ticket.escalation_reason == "Low AI confidence"
    assert ticket.messages.filter(sender_role=SenderRole.SYSTEM).exists()
