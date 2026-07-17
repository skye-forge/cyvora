from django.contrib import admin

from .models import Option, Question, Quiz, QuizAnswer, QuizAttempt


class OptionInline(admin.TabularInline):
    model = Option
    extra = 4


class QuestionAdmin(admin.ModelAdmin):
    inlines = [OptionInline]
    list_display = ["text_en", "quiz", "order"]


admin.site.register(Quiz)
admin.site.register(Question, QuestionAdmin)
admin.site.register(QuizAttempt)
admin.site.register(QuizAnswer)
