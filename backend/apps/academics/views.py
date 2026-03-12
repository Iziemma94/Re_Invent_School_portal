from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsStudentUserRole, IsTeacherUserRole
from apps.students.models import StudentProfile, TeacherProfile, StudentEnrollment

from .models import Note, Result, ReportCard, TeachingAssignment, ResultPin
from .serializers import (
    NoteSerializer,
    ResultSerializer,
    ReportCardSerializer,
    TeachingAssignmentSerializer,
)


class StudentResultsView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUserRole]

    def get(self, request):
        student = get_object_or_404(StudentProfile, user=request.user)
        results = Result.objects.filter(student=student).select_related(
            "teaching_assignment__class_subject__subject",
            "teaching_assignment__teacher__user",
            "term",
        )
        serializer = ResultSerializer(results, many=True)
        return Response(serializer.data)


class StudentReportCardsView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUserRole]

    def get(self, request):
        student = get_object_or_404(StudentProfile, user=request.user)
        report_cards = ReportCard.objects.filter(student=student).select_related("term")
        serializer = ReportCardSerializer(report_cards, many=True)
        return Response(serializer.data)


class StudentNotesView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUserRole]

    def get(self, request):
        student = get_object_or_404(StudentProfile, user=request.user)
        enrollment = StudentEnrollment.objects.filter(
            student=student,
            is_active=True
        ).select_related("school_class").first()

        if not enrollment:
            return Response({"detail": "No active enrollment found."}, status=404)

        notes = Note.objects.filter(
            teaching_assignment__class_subject__school_class=enrollment.school_class
        ).select_related(
            "teaching_assignment__class_subject__subject",
            "teaching_assignment__teacher__user",
            "teaching_assignment__class_subject__school_class",
            "term",
        )

        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)


class TeacherAssignmentsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherUserRole]

    def get(self, request):
        teacher = get_object_or_404(TeacherProfile, user=request.user)
        assignments = TeachingAssignment.objects.filter(teacher=teacher).select_related(
            "class_subject__subject",
            "class_subject__school_class",
        )
        serializer = TeachingAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)


class VerifyResultPinView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUserRole]

    def post(self, request):
        pin = request.data.get("pin")
        term_id = request.data.get("term")

        student = get_object_or_404(StudentProfile, user=request.user)

        try:
            pin_record = ResultPin.objects.get(
                student=student,
                term_id=term_id,
                pin=pin
            )
        except ResultPin.DoesNotExist:
            return Response(
                {"detail": "Invalid PIN"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if pin_record.is_used:
            return Response(
                {"detail": "PIN already used"},
                status=status.HTTP_400_BAD_REQUEST
            )

        pin_record.is_used = True
        pin_record.save()

        return Response({"detail": "PIN verified"})


class TeacherNoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated, IsTeacherUserRole]

    def get_queryset(self):

        teacher = TeacherProfile.objects.get(user=self.request.user)

        return Note.objects.filter(
            teaching_assignment__teacher=teacher
        )
    
class TeacherResultViewSet(viewsets.ModelViewSet):

    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated, IsTeacherUserRole]

    def get_queryset(self):

        teacher = TeacherProfile.objects.get(user=self.request.user)

        return Result.objects.filter(
            teaching_assignment__teacher=teacher
        )