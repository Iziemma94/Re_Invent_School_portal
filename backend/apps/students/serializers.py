from rest_framework import serializers
from .models import StudentProfile, TeacherProfile, StudentEnrollment


class StudentProfileSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source="user.full_name", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user",
            "username",
            "user_full_name",
            "admission_number",
            "date_of_birth",
            "gender",
            "branch",
            "section",
        ]


class TeacherProfileSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source="user.full_name", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = TeacherProfile
        fields = [
            "id",
            "user",
            "username",
            "user_full_name",
            "staff_id",
            "branch",
            "section",
        ]


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    class_name = serializers.CharField(source="school_class.name", read_only=True)
    class_arm = serializers.CharField(source="school_class.arm", read_only=True)
    session_name = serializers.CharField(source="session.name", read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = [
            "id",
            "student",
            "student_name",
            "school_class",
            "class_name",
            "class_arm",
            "session",
            "session_name",
            "is_active",
        ]