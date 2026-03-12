from django.urls import path
from .views import StudentFeesView

urlpatterns = [
    path("student/fees/", StudentFeesView.as_view(), name="student-fees"),
]