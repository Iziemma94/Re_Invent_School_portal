# Register your models here.
from django.contrib import admin
from .models import StudentProfile, TeacherProfile, StudentEnrollment


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "admission_number", "branch", "section")
    search_fields = ("admission_number", "user__full_name")


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "staff_id", "branch", "section")


@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "school_class", "session", "is_active")
    list_filter = ("session", "is_active")