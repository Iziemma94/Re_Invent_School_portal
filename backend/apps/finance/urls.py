from django.urls import path
from .views import (
    StudentFeesView,
    AdminFeeListView,
    AdminFeeStructureListCreateView,
    AdminFeeStructureUpdateView,
    AdminStudentFeeAssignListCreateView,
    AdminStudentFeeUpdateView,
    AdminStudentPaymentListCreateView,
    AdminFeeAssignmentStudentsView,
)

urlpatterns = [
    path("student/fees/", StudentFeesView.as_view(), name="student-fees"),
    path("admin/fees/", AdminFeeListView.as_view(), name="admin-fees"),

    path(
        "admin/fee-structures/",
        AdminFeeStructureListCreateView.as_view(),
        name="admin-fee-structures",
    ),
    path(
        "admin/fee-structures/<int:fee_structure_id>/update/",
        AdminFeeStructureUpdateView.as_view(),
        name="admin-update-fee-structure",
    ),

    path(
        "admin/fee-assignment-students/",
        AdminFeeAssignmentStudentsView.as_view(),
        name="admin-fee-assignment-students",
    ),

    path(
        "admin/student-fees/",
        AdminStudentFeeAssignListCreateView.as_view(),
        name="admin-student-fees",
    ),
    path(
        "admin/student-fees/<int:student_fee_id>/update/",
        AdminStudentFeeUpdateView.as_view(),
        name="admin-update-student-fee",
    ),

    path(
        "admin/payments/",
        AdminStudentPaymentListCreateView.as_view(),
        name="admin-payments",
    ),
]