"""Views for account-related API endpoints."""

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UserSerializer


class CurrentUserView(APIView):
    """Return the currently authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Handle GET request."""
        serializer = UserSerializer(
            request.user,
            context={"request": request},
        )

        return Response(serializer.data)
