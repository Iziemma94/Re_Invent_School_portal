# Register your models here.

from django.contrib import admin
from .models import Branch, Section, AcademicSession, Term, SchoolClass


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "location")
    search_fields = ("name", "location")


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(AcademicSession)
class AcademicSessionAdmin(admin.ModelAdmin):
    list_display = ("name", "start_date", "end_date", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = ("name", "session", "is_active")
    list_filter = ("name", "is_active", "session")


@admin.register(SchoolClass)
class SchoolClassAdmin(admin.ModelAdmin):
    list_display = ("name", "arm", "branch", "section")
    list_filter = ("branch", "section")
    search_fields = ("name", "arm")