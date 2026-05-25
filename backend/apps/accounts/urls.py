"""URL routes for account-related API endpoints."""

from django.urls import path
from .views import CurrentUserView

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="current-user"),
]
