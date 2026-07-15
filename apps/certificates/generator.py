import io

from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone

from shared.mixins.audit_loggable import log_audit_action
from shared.utils.reference_codes import generate_unique_reference_code

from .models import Certificate, CERTIFICATE_VALIDITY_DAYS


def issue_certificate(*, payment) -> Certificate:
    """
    Creates the Certificate row from a successful payment. Called by
    certificates/signals.py when payment_succeeded fires. Asset
    generation (QR + PDF) is deliberately NOT done here — it's queued
    async via tasks.py so the signal handler returns fast.
    """
    course_id = payment.metadata.get("course_id")
    tier = payment.metadata.get("tier")

    from learning.models import Course

    course = Course.objects.get(id=course_id)

    cert_code = generate_unique_reference_code(
        "CERT", Certificate, field_name="cert_code", length=10
    )

    certificate = Certificate.objects.create(
        user=payment.user,
        course=course,
        payment=payment,
        tier=tier,
        cert_code=cert_code,
        expires_at=timezone.now() + timezone.timedelta(days=CERTIFICATE_VALIDITY_DAYS),
    )

    log_audit_action(
        payment.user,
        "certificate.issued",
        certificate,
        {
            "course_id": str(course.id),
            "tier": tier,
            "payment_ref": payment.transaction_ref,
        },
    )

    from .tasks import generate_certificate_assets

    generate_certificate_assets.delay(str(certificate.id))

    return certificate


def build_verify_url(certificate: Certificate) -> str:
    return f"{settings.FRONTEND_BASE_URL}/certificates/verify/{certificate.cert_code}"


def generate_qr_bytes(*, verify_url: str) -> bytes:
    import qrcode

    qr_img = qrcode.make(verify_url)
    buffer = io.BytesIO()
    qr_img.save(buffer, format="PNG")
    return buffer.getvalue()


def generate_pdf_bytes(*, certificate: Certificate, verify_url: str) -> bytes:
    from integrations.pdf.certificate_renderer import render_certificate_pdf

    return render_certificate_pdf(certificate=certificate, verify_url=verify_url)


def attach_assets(*, certificate: Certificate) -> Certificate:
    """
    Generates QR + PDF and saves both onto the Certificate row.
    Called from tasks.generate_certificate_assets — kept as a plain
    function (not the task itself) so it's independently testable
    without Celery in the loop.
    """
    verify_url = build_verify_url(certificate)

    qr_bytes = generate_qr_bytes(verify_url=verify_url)
    certificate.qr_file.save(
        f"{certificate.cert_code}.png", ContentFile(qr_bytes), save=False
    )

    pdf_bytes = generate_pdf_bytes(certificate=certificate, verify_url=verify_url)
    certificate.pdf_file.save(
        f"{certificate.cert_code}.pdf", ContentFile(pdf_bytes), save=False
    )

    certificate.save(update_fields=["qr_file", "pdf_file"])
    return certificate
