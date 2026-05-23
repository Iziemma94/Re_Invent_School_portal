from django.urls import path
from .views import (
    CurrentStudentProfileView,
    CurrentTeacherProfileView,
    CurrentStudentEnrollmentView,
    StudentDashboardView,
    AdminStudentListView,
    AdminTeacherListView,
    AdminStudentCreateView,
    AdminTeacherCreateView,
    AdminStudentUpdateView,
    AdminTeacherUpdateView,
    AdminDeactivateStudentView,
    AdminActivateStudentView,
    AdminDeactivateTeacherView,
    AdminActivateTeacherView,
)

urlpatterns = [
    path("me/student-profile/", CurrentStudentProfileView.as_view(), name="current-student-profile"),
    path("me/teacher-profile/", CurrentTeacherProfileView.as_view(), name="current-teacher-profile"),
    path("me/enrollment/", CurrentStudentEnrollmentView.as_view(), name="current-student-enrollment"),
    path("student/dashboard/", StudentDashboardView.as_view(), name="student-dashboard"),

    path("admin/students/", AdminStudentListView.as_view(), name="admin-students"),
    path("admin/students/create/", AdminStudentCreateView.as_view(), name="admin-create-student"),
    path("admin/students/<int:student_id>/update/", AdminStudentUpdateView.as_view(), name="admin-update-student"),
    path("admin/students/<int:student_id>/deactivate/", AdminDeactivateStudentView.as_view(), name="admin-deactivate-student"),
    path("admin/students/<int:student_id>/activate/", AdminActivateStudentView.as_view(), name="admin-activate-student"),

    path("admin/teachers/", AdminTeacherListView.as_view(), name="admin-teachers"),
    path("admin/teachers/create/", AdminTeacherCreateView.as_view(), name="admin-create-teacher"),
    path("admin/teachers/<int:teacher_id>/update/", AdminTeacherUpdateView.as_view(), name="admin-update-teacher"),
    path("admin/teachers/<int:teacher_id>/deactivate/", AdminDeactivateTeacherView.as_view(), name="admin-deactivate-teacher"),
    path("admin/teachers/<int:teacher_id>/activate/", AdminActivateTeacherView.as_view(), name="admin-activate-teacher"),
]