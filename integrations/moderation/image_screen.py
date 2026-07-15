# Stub for an image moderation provider (AWS Rekognition, Google Vision
# SafeSearch, etc). Wire the real client in here later — everything that
# calls this only depends on the (is_flagged, reason) return contract.


def screen_image(media_url: str) -> tuple[bool, str]:
    """
    Returns (is_flagged, reason).
    TODO: replace with a real call, e.g.:
        result = rekognition_client.detect_moderation_labels(Image={"S3Object": ...})
        return bool(result["ModerationLabels"]), result["ModerationLabels"]
    """
    if not media_url:
        return False, ""
    return False, ""  # no-op until a real provider is wired in
