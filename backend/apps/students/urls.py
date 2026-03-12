from django.urls import path
from .views import (
    CurrentStudentProfileView,
    CurrentTeacherProfileView,
    CurrentStudentEnrollmentView,
    StudentDashboardView,
)

urlpatterns = [
    path("me/student-profile/", CurrentStudentProfileView.as_view(), name="current-student-profile"),
    path("me/teacher-profile/", CurrentTeacherProfileView.as_view(), name="current-teacher-profile"),
    path("me/enrollment/", CurrentStudentEnrollmentView.as_view(), name="current-student-enrollment"),
    path("student/dashboard/", StudentDashboardView.as_view(), name="student-dashboard"),
]