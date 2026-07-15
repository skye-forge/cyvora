from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-created_at"]
    list_display = ["email", "name", "role", "xp_points", "level", "is_verified", "is_active"]
    list_filter = ["role", "language", "is_verified", "is_active"]
    search_fields = ["email", "name", "phone"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("name", "phone", "language")}),
        ("Gamification", {"fields": ("xp_points", "level", "streak_count")}),
        ("Permissions", {"fields": (
            "role", "is_verified", "is_active", "is_staff", "is_superuser",
            "groups", "user_permissions",
        )}),
        ("Important dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "name", "password1", "password2", "role"),
        }),
    )
