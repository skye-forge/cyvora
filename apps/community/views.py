
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.permissions.roles import IsModerator

from . import selectors, services
from .models import CommunityPost, CommunityContentReport
from .serializers import (
    CommunityPostSerializer,
    CommunityCommentSerializer,
    TipCreateSerializer,
    CommentCreateSerializer,
    ContentReportSerializer,
    ModerationDecisionSerializer,
)

# ---------- Citizen-facing ----------


class CommunityFeedListView(generics.ListAPIView):
    """FR-COM-01/02: chronological feed, filterable by tag or keyword search."""

    permission_classes = [AllowAny]
    serializer_class = CommunityPostSerializer

    def get_queryset(self):
        tag = self.request.query_params.get("tag")
        query = self.request.query_params.get("q")
        return selectors.get_feed(tag=tag, query=query)


class TipCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TipCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        post = services.publish_tip(actor=request.user, **serializer.validated_data)
        return Response(
            {"success": True, "result": CommunityPostSerializer(post).data},
            status=status.HTTP_201_CREATED,
        )


class PostCommentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        post = CommunityPost.objects.get(pk=pk)
        comments = post.comments.select_related("author")
        return Response(
            {
                "success": True,
                "results": CommunityCommentSerializer(comments, many=True).data,
            }
        )

    def post(self, request, pk):
        serializer = CommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        post = CommunityPost.objects.get(pk=pk)
        comment = services.add_comment(
            actor=request.user, post=post, **serializer.validated_data
        )
        return Response(
            {"success": True, "result": CommunityCommentSerializer(comment).data},
            status=status.HTTP_201_CREATED,
        )


class PostLikeToggleView(APIView):
    """POST = like, DELETE = unlike. FR-COM-05."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        post = CommunityPost.objects.get(pk=pk)
        created = services.like_post(actor=request.user, post=post)
        return Response({"success": True, "liked": created})

    def delete(self, request, pk):
        post = CommunityPost.objects.get(pk=pk)
        services.unlike_post(actor=request.user, post=post)
        return Response({"success": True, "liked": False})


class PostReportView(APIView):
    """FR-COM-06: flag inappropriate content."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        serializer = ContentReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        post = CommunityPost.objects.get(pk=pk)
        report = services.report_content(
            actor=request.user, post=post, **serializer.validated_data
        )
        return Response(
            {"success": True, "report_id": report.id}, status=status.HTTP_201_CREATED
        )


# ---------- Moderator-facing — imported into admin_console/urls.py ----------


class CommunityModerationQueueView(generics.ListAPIView):
    """Posts escalated by automated screening, awaiting human review."""

    permission_classes = [IsModerator]
    serializer_class = CommunityPostSerializer
    queryset = selectors.flagged_queue()


class CommunityContentReportQueueView(generics.ListAPIView):
    """User-filed content reports awaiting review."""

    permission_classes = [IsModerator]

    def get(self, request):
        reports = selectors.pending_content_reports()
        data = [
            {
                "id": r.id,
                "post_id": r.post_id,
                "post_content": r.post.content,
                "reporter": getattr(r.reporter, "full_name", str(r.reporter_id)),
                "reason": r.reason,
                "created_at": r.created_at,
            }
            for r in reports
        ]
        return Response({"success": True, "results": data})


class CommunityModerationDecisionView(APIView):
    permission_classes = [IsModerator]

    def post(self, request, pk):
        serializer = ModerationDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        post = CommunityPost.objects.get(pk=pk)
        post = services.moderate_post(
            actor=request.user, post=post, **serializer.validated_data
        )
        return Response({"success": True, "moderation_status": post.moderation_status})


class CommunityContentReportResolveView(APIView):
    permission_classes = [IsModerator]

    def post(self, request, pk):
        serializer = ModerationDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        content_report = CommunityContentReport.objects.select_related("post").get(
            pk=pk
        )
        services.resolve_content_report(
            actor=request.user,
            content_report=content_report,
            decision=serializer.validated_data["decision"],
            mod_reason=serializer.validated_data.get("reason", ""),
        )
        return Response({"success": True})
