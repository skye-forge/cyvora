from django.contrib.auth import get_user_model

User = get_user_model()


def get_national_leaderboard(limit: int = 50):
    return User.objects.filter(is_active=True).order_by("-xp_points", "-level")[:limit]


def get_regional_leaderboard(region: str, limit: int = 50):
    return User.objects.filter(is_active=True, region=region).order_by(
        "-xp_points", "-level"
    )[:limit]


def get_institution_leaderboard(institution_id, limit: int = 50):
    return User.objects.filter(
        is_active=True, institution_memberships__institution_id=institution_id
    ).order_by("-xp_points", "-level")[:limit]


def get_user_ranking(user, *, region: str | None = None) -> dict:
    qs = User.objects.filter(is_active=True)
    if region:
        qs = qs.filter(region=region)

    total = qs.count()
    if total == 0:
        return {"rank": 0, "total": 0, "percentile": 0.0}

    above = qs.filter(xp_points__gt=user.xp_points).count()
    rank = above + 1
    percentile = round(((total - rank) / total) * 100, 1)
    return {"rank": rank, "total": total, "percentile": percentile}
