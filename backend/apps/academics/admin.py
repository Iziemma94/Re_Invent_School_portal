# Register your models here.

from django.contrib import admin
from .models import (
    Subject,
    ClassSubject,
    TeachingAssignment,
    ClassTeacherAssignment,
    Note,
    Result,
    ReportCard,
    ResultPin,
)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "code")
    search_fields = ("name", "code")


@admin.register(ClassSubject)
class ClassSubjectAdmin(admin.ModelAdmin):
    list_display = ("school_class", "subject", "session")
    list_filter = ("session", "school_class")
    search_fields = ("subject__name", "school_class__name")


@admin.register(TeachingAssignment)
class TeachingAssignmentAdmin(admin.ModelAdmin):
    list_display = ("teacher", "class_subject")
    list_filter = ("teacher",)


@admin.register(ClassTeacherAssignment)
class ClassTeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ("teacher", "school_class", "session")
    list_filter = ("session", "school_class")


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("title", "teaching_assignment", "term", "uploaded_at")
    list_filter = ("term", "uploaded_at")


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "teaching_assignment",
        "term",
        "continuous_assessment",
        "exam_score",
        "total_score",
    )
    list_filter = ("term",)
    search_fields = ("student__user__full_name",)


@admin.register(ReportCard)
class ReportCardAdmin(admin.ModelAdmin):
    list_display = ("student", "term", "performance_rating", "generated_at")
    list_filter = ("term",)


@admin.register(ResultPin)
class ResultPinAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "term",
        "pin",
        "usage_count",
        "max_usage",
        "remaining_uses_display",
        "created_at",
    )
    list_filter = ("term", "max_usage", "created_at")
    search_fields = (
        "student__user__full_name",
        "student__user__username",
        "student__admission_number",
        "pin",
    )

    def remaining_uses_display(self, obj):
        return obj.remaining_uses
    remaining_uses_display.short_description = "Remaining Uses"