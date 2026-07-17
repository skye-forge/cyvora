from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "xp_points", "level"]
        # never expose email/phone on a public-facing leaderboard
