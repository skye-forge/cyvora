import io

import qrcode
from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas

from apps.certificates.models import CERTIFICATE_VALIDITY_DAYS, Certificate
from shared.exceptions import ValidationFailedError
from shared.helpers import generate_unique_code

from .eligibility import is_eligible_for


def issue_certificate(*, user, tier: str) -> Certificate:
    if not is_eligible_for(user, tier):
        raise ValidationFailedError(
            f"User is not yet eligible for the {tier} certificate."
        )

    if Certificate.objects.filter(user=user, tier=tier).exists():
        raise ValidationFailedError(
            f"A {tier} certificate has already been issued to this user."
        )

    cert_code = generate_unique_code(prefix="DC-")
    certificate = Certificate.objects.create(
        user=user,
        tier=tier,
        cert_code=cert_code,
        expires_at=timezone.now() + timezone.timedelta(days=CERTIFICATE_VALIDITY_DAYS),
    )

    _attach_qr_code(certificate)
    _attach_pdf(certificate)
    certificate.save(update_fields=["qr_file", "pdf_file"])
    return certificate


def _attach_qr_code(certificate: Certificate) -> None:
    verify_url = (
        f"{settings.PUBLIC_BASE_URL}/api/v1/certificates/verify/{certificate.cert_code}"
    )
    img = qrcode.make(verify_url)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    certificate.qr_file.save(
        f"{certificate.cert_code}.png",
        ContentFile(buffer.getvalue()),
        save=False,
    )


def _attach_pdf(certificate: Certificate) -> None:
    buffer = io.BytesIO()
    page = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    page.setFillColorRGB(0.024, 0.106, 0.2)  # Navy Blue #061B33
    page.rect(0, 0, width, height, fill=True, stroke=False)

    page.setFillColorRGB(0.831, 0.627, 0.09)  # Gold #D4A017
    page.setFont("Helvetica-Bold", 28)
    page.drawCentredString(width / 2, height - 120, "VARNIS")

    page.setFillColorRGB(1, 1, 1)
    page.setFont("Helvetica", 16)
    page.drawCentredString(width / 2, height - 160, "Certificate of Completion")

    page.setFont("Helvetica-Bold", 22)
    page.drawCentredString(width / 2, height - 220, certificate.user.name)

    page.setFont("Helvetica", 14)
    page.drawCentredString(
        width / 2,
        height - 250,
        f"{certificate.get_tier_display()} Tier — Issued {certificate.issued_at.date()}",
    )

    page.setFont("Helvetica", 10)
    page.drawCentredString(width / 2, 60, f"Certificate ID: {certificate.cert_code}")
    verify_line = f"Verify at: {settings.PUBLIC_BASE_URL}/certificates/verify/{certificate.cert_code}"
    page.drawCentredString(width / 2, 44, verify_line)

    page.showPage()
    page.save()

    certificate.pdf_file.save(
        f"{certificate.cert_code}.pdf",
        ContentFile(buffer.getvalue()),
        save=False,
    )
