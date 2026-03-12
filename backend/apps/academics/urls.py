from django.urls import path
from .views import (
    StudentResultsView,
    StudentReportCardsView,
    StudentNotesView,
    TeacherAssignmentsView,
    VerifyResultPinView,
)

urlpatterns = [
    path("student/results/", StudentResultsView.as_view(), name="student-results"),
    path("student/report-cards/", StudentReportCardsView.as_view(), name="student-report-cards"),
    path("student/notes/", StudentNotesView.as_view(), name="student-notes"),
    path("teacher/assignments/", TeacherAssignmentsView.as_view(), name="teacher-assignments"),
    path("student/verify-pin/", VerifyResultPinView.as_view(), name="verify-result-pin"),
]