from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsStudentUserRole, IsTeacherUserRole
from apps.academics.models import Note, Result
from apps.finance.models import StudentFee

from .models import StudentProfile, TeacherProfile, StudentEnrollment
from .serializers import (
    StudentProfileSerializer,
    TeacherProfileSerializer,
    StudentEnrollmentSerializer,
)


class CurrentStudentProfileView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUserRole]

    def get(self, request):
        profile = get_object_or_404(StudentProfile, user=request.user)
        serializer = StudentProfileSerializer(profile)
        return Response(serializer.data)


class CurrentTeacherProfileView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherUserRole]

    def get(self, request):
        profile = get_object_or_404(TeacherProfile, user=request.user)
        serializer = TeacherProfileSerializer(profile)
        return Response(serializer.data)


class CurrentStudentEnrollmentView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUserRole]

    def get(self, request):
        profile = get_object_or_404(StudentProfile, user=request.user)
        enrollment = StudentEnrollment.objects.filter(
            student=profile,
            is_active=True
        ).select_related("school_class", "session").first()

        if not enrollment:
            return Response({"detail": "No active enrollment found."}, status=404)

        serializer = StudentEnrollmentSerializer(enrollment)
        return Response(serializer.data)


class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUserRole]

    def get(self, request):
        student = get_object_or_404(StudentProfile, user=request.user)

        enrollment = StudentEnrollment.objects.filter(
            student=student,
            is_active=True
        ).select_related("school_class").first()

        results_count = Result.objects.filter(student=student).count()

        notes_count = 0
        if enrollment:
            notes_count = Note.objects.filter(
                teaching_assignment__class_subject__school_class=enrollment.school_class
            ).count()

        fees = StudentFee.objects.filter(student=student)
        outstanding = sum(fee.balance for fee in fees)

        return Response({
            "results_count": results_count,
            "notes_count": notes_count,
            "outstanding_fees": outstanding,
        })