from django.contrib import admin

from .models import CommunityPost, CommunityComment, CommunityLike, CommunityContentReport


@admin.register(CommunityPost)
class CommunityPostAdmin(admin.ModelAdmin):
    list_display = [
        "type",
        "moderation_status",
        "author",
        "likes_count",
        "reports_count",
        "created_at",
    ]
    list_filter = ["type", "moderation_status"]
    search_fields = ["content"]


admin.site.register(CommunityComment)
admin.site.register(CommunityLike)
admin.site.register(CommunityContentReport)
