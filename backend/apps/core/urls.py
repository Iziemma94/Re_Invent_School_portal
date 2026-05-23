from django.urls import path
from .views import (
    SettingListView,
    SettingUpdateView,
    SettingBulkUpdateView,
    BranchListView,
    SectionListView,
    AcademicSessionListView,
    SchoolClassListView,
    AdminSchoolClassCreateView,
    AdminSchoolClassUpdateView,
)

urlpatterns = [
    path("settings/", SettingListView.as_view(), name="settings-list"),
    path("settings/bulk-update/", SettingBulkUpdateView.as_view(), name="settings-bulk-update"),
    path("settings/<int:setting_id>/update/", SettingUpdateView.as_view(), name="settings-update"),
    path("branches/", BranchListView.as_view(), name="branch-list"),
    path("sections/", SectionListView.as_view(), name="section-list"),
    path("sessions/", AcademicSessionListView.as_view(), name="session-list"),
    path("classes/", SchoolClassListView.as_view(), name="class-list"),
    path("classes/create/", AdminSchoolClassCreateView.as_view(), name="class-create"),
    path("classes/<int:class_id>/update/", AdminSchoolClassUpdateView.as_view(), name="class-update"),
]