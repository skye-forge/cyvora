from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from api.responses import build_success_response_schema, success_response
from . import selectors
from .serializers import LeaderboardEntrySerializer


class NationalLeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            200: build_success_response_schema(
                serializers.ListSerializer(child=LeaderboardEntrySerializer())
            )
        }
    )
    def get(self, request):
        entries = selectors.get_national_leaderboard()
        return success_response(
            data=LeaderboardEntrySerializer(entries, many=True).data
        )


class RegionalLeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            200: build_success_response_schema(
                serializers.ListSerializer(child=LeaderboardEntrySerializer())
            )
        }
    )
    def get(self, request, region):
        entries = selectors.get_regional_leaderboard(region)
        return success_response(
            data=LeaderboardEntrySerializer(entries, many=True).data
        )


class InstitutionLeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            200: build_success_response_schema(
                serializers.ListSerializer(child=LeaderboardEntrySerializer())
            )
        }
    )
    def get(self, request, institution_id):
        entries = selectors.get_institution_leaderboard(institution_id)
        return success_response(
            data=LeaderboardEntrySerializer(entries, many=True).data
        )


class MyRankingView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: build_success_response_schema(serializers.DictField())}
    )
    def get(self, request):
        region = request.query_params.get("region")
        ranking = selectors.get_user_ranking(request.user, region=region)
        return success_response(data=ranking)
