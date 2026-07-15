# ReportLab-based certificate renderer. Swap the layout/branding details
# once Jessi's certificate design assets are finalized — this establishes
# the render_certificate_pdf(certificate, verify_url) -> bytes contract
# that tasks.py depends on.

import io
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm


def render_certificate_pdf(*, certificate, verify_url: str) -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    c.setFillColorRGB(0.024, 0.106, 0.2)  # Navy #061B33
    c.rect(0, 0, width, height, fill=True, stroke=False)

    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(width / 2, height - 4 * cm, "CERTIFICATE OF COMPLETION")

    c.setFont("Helvetica", 16)
    c.drawCentredString(width / 2, height - 6 * cm, f"This certifies that")

    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(width / 2, height - 7.5 * cm, certificate.user.full_name)

    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2, height - 9 * cm, f"has completed the course")
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, height - 10 * cm, certificate.course.title_en)

    c.setFont("Helvetica", 10)
    c.drawString(2 * cm, 2 * cm, f"Certificate ID: {certificate.cert_code}")
    c.drawString(2 * cm, 1.5 * cm, f"Issued: {certificate.issued_at:%d %b %Y}")
    c.drawString(2 * cm, 1.0 * cm, f"Verify: {verify_url}")

    c.showPage()
    c.save()

    buffer.seek(0)
    return buffer.read()
