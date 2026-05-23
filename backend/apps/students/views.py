import json

from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.accounts.permissions import IsStudentUserRole, IsTeacherUserRole, IsAdminUserRole
from apps.academics.models import Note, Result
from apps.finance.models import StudentFee

from .models import StudentProfile, TeacherProfile, StudentEnrollment
from .serializers import (
    StudentProfileSerializer,
    TeacherProfileSerializer,
    StudentEnrollmentSerializer,
    AdminCreateStudentSerializer,
    AdminCreateTeacherSerializer,
    AdminUpdateStudentSerializer,
    AdminUpdateTeacherSerializer,
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
        profile = get_object_or_404(
            TeacherProfile.objects.prefetch_related("branches", "sections"),
            user=request.user
        )
        serializer = TeacherProfileSerializer(profile, context={"request": request})
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


class AdminStudentListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        students = StudentProfile.objects.select_related(
            "user",
            "branch",
            "section",
        ).order_by("user__full_name")

        data = []
        for student in students:
            enrollment = StudentEnrollment.objects.filter(
                student=student,
                is_active=True
            ).select_related("school_class", "session").first()

            data.append(
                {
                    "id": student.id,
                    "student_name": student.user.full_name or student.user.username,
                    "full_name": student.user.full_name,
                    "username": student.user.username,
                    "phone_number": student.user.phone_number,
                    "profile_picture": student.user.profile_picture.url if student.user.profile_picture else None,
                    "is_active": student.user.is_active,
                    "admission_number": student.admission_number,
                    "date_of_birth": student.date_of_birth,
                    "gender": student.gender,
                    "branch": student.branch.id if student.branch else None,
                    "branch_name": student.branch.name if student.branch else None,
                    "section": student.section.id if student.section else None,
                    "section_name": student.section.name if student.section else None,
                    "school_class": enrollment.school_class.id if enrollment and enrollment.school_class else None,
                    "class_name": enrollment.school_class.name if enrollment and enrollment.school_class else None,
                    "class_arm": enrollment.school_class.arm if enrollment and enrollment.school_class else None,
                    "session": enrollment.session.id if enrollment and enrollment.session else None,
                    "session_name": enrollment.session.name if enrollment and enrollment.session else None,
                }
            )

        return Response(data)


class AdminTeacherListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        teachers = TeacherProfile.objects.select_related(
            "user",
            "branch",
            "section",
        ).prefetch_related(
            "branches",
            "sections",
        ).order_by("user__full_name")

        data = [
            {
                "id": teacher.id,
                "teacher_name": teacher.user.full_name or teacher.user.username,
                "full_name": teacher.user.full_name,
                "username": teacher.user.username,
                "phone_number": teacher.user.phone_number,
                "profile_picture": teacher.user.profile_picture.url if teacher.user.profile_picture else None,
                "is_active": teacher.user.is_active,
                "staff_id": teacher.staff_id,
                "branches": list(teacher.branches.values_list("id", flat=True)) or ([teacher.branch.id] if teacher.branch else []),
                "branch_names": [branch.name for branch in teacher.branches.all()] or ([teacher.branch.name] if teacher.branch else []),
                "sections": list(teacher.sections.values_list("id", flat=True)) or ([teacher.section.id] if teacher.section else []),
                "section_names": [section.name for section in teacher.sections.all()] or ([teacher.section.name] if teacher.section else []),
            }
            for teacher in teachers
        ]

        return Response(data)


class AdminStudentCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = AdminCreateStudentSerializer(data=request.data)
        if serializer.is_valid():
            student = serializer.save()
            return Response(
                {
                    "message": "Student created successfully.",
                    "student": StudentProfileSerializer(student).data,
                },
                status=201,
            )
        return Response(serializer.errors, status=400)


class AdminStudentUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def put(self, request, student_id):
        student = get_object_or_404(StudentProfile, id=student_id)
        serializer = AdminUpdateStudentSerializer(
            student,
            data=request.data,
            context={"student": student},
        )

        if serializer.is_valid():
            updated_student = serializer.save()
            return Response(
                {
                    "message": "Student updated successfully.",
                    "student": StudentProfileSerializer(updated_student).data,
                },
                status=200,
            )
        return Response(serializer.errors, status=400)


class AdminTeacherCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        data = request.data.copy()

        branches = data.get("branches")
        sections = data.get("sections")

        if isinstance(branches, str):
            try:
                parsed = json.loads(branches)
                data.setlist("branches", [str(item) for item in parsed])
            except Exception:
                pass

        if isinstance(sections, str):
            try:
                parsed = json.loads(sections)
                data.setlist("sections", [str(item) for item in parsed])
            except Exception:
                pass

        serializer = AdminCreateTeacherSerializer(data=data)
        if serializer.is_valid():
            teacher = serializer.save()
            return Response(
                {
                    "message": "Teacher created successfully.",
                    "teacher": TeacherProfileSerializer(teacher).data,
                },
                status=201,
            )
        return Response(serializer.errors, status=400)


class AdminTeacherUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def put(self, request, teacher_id):
        teacher = get_object_or_404(TeacherProfile, id=teacher_id)
        data = request.data.copy()

        branches = data.get("branches")
        sections = data.get("sections")

        if isinstance(branches, str):
            try:
                parsed = json.loads(branches)
                data.setlist("branches", [str(item) for item in parsed])
            except Exception:
                pass

        if isinstance(sections, str):
            try:
                parsed = json.loads(sections)
                data.setlist("sections", [str(item) for item in parsed])
            except Exception:
                pass

        serializer = AdminUpdateTeacherSerializer(
            teacher,
            data=data,
            context={"teacher": teacher},
        )

        if serializer.is_valid():
            updated_teacher = serializer.save()
            return Response(
                {
                    "message": "Teacher updated successfully.",
                    "teacher": TeacherProfileSerializer(updated_teacher).data,
                },
                status=200,
            )
        return Response(serializer.errors, status=400)


class AdminDeactivateStudentView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def post(self, request, student_id):
        student = get_object_or_404(StudentProfile, id=student_id)
        student.user.is_active = False
        student.user.save()
        return Response({"message": "Student deactivated successfully."}, status=200)


class AdminActivateStudentView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def post(self, request, student_id):
        student = get_object_or_404(StudentProfile, id=student_id)
        student.user.is_active = True
        student.user.save()
        return Response({"message": "Student activated successfully."}, status=200)


class AdminDeactivateTeacherView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def post(self, request, teacher_id):
        teacher = get_object_or_404(TeacherProfile, id=teacher_id)
        teacher.user.is_active = False
        teacher.user.save()
        return Response({"message": "Teacher deactivated successfully."}, status=200)


class AdminActivateTeacherView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def post(self, request, teacher_id):
        teacher = get_object_or_404(TeacherProfile, id=teacher_id)
        teacher.user.is_active = True
        teacher.user.save()
        return Response({"message": "Teacher activated successfully."}, status=200)