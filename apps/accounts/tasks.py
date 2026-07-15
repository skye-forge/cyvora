from celery import shared_task


@shared_task(bind=True, max_retries=3)
def send_welcome_email(self, user_id):
    from apps.notifications.tasks import send_email_task

    from .selectors import get_user_by_id

    user = get_user_by_id(user_id)
    send_email_task.delay(
        to=user.email,
        subject=(
            "Welcome to Varnis" if user.language == "en" else "Bienvenue sur Varnis"
        ),
        template_name="emails/welcome.html",
        context={"name": user.name, "language": user.language},
    )
    return f"welcome email queued for {user.email}"
