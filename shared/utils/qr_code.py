import io
import qrcode


def generate_qr_png_bytes(*, url: str) -> bytes:
    """
    Single source of truth for QR generation — certificates/generator.py
    should call this instead of instantiating qrcode.make() inline.
    """
    img = qrcode.make(url)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()
