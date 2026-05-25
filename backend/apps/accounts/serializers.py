"""Serializers for account-related API responses."""

from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serialize authenticated user data."""

    profile_picture = serializers.SerializerMethodField()

    class Meta:
        """Serializer configuration."""

        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "email",
            "role",
            "phone_number",
            "profile_picture",
        ]

    def get_profile_picture(self, obj):
        """Return absolute profile picture URL."""
        request = self.context.get("request")

        if obj.profile_picture:
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)

            return obj.profile_picture.url

        return None
