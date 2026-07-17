from django.core.exceptions import ValidationError

ALLOWED_EVIDENCE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_EVIDENCE_FILE_SIZE_BYTES = (
    8 * 1024 * 1024
)  # 8MB — generous for a phone screenshot on 3G upload


def validate_evidence_file(uploaded_file) -> None:
    if uploaded_file.content_type not in ALLOWED_EVIDENCE_CONTENT_TYPES:
        raise ValidationError(
            f"Unsupported file type '{uploaded_file.content_type}'. Allowed: JPEG, PNG, WEBP."
        )
    if uploaded_file.size > MAX_EVIDENCE_FILE_SIZE_BYTES:
        raise ValidationError("File is too large. Maximum size is 8MB.")
