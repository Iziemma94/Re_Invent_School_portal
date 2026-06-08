from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from django.db.models import Q
from django.http import HttpResponse
from django.template.loader import render_to_string

from apps.accounts.permissions import IsStudentUserRole, IsTeacherUserRole, IsAdminUserRole
from apps.students.models import StudentProfile, TeacherProfile, StudentEnrollment


from .models import (
    Note,
    Result,
    ReportCard,
    ReportCardTrait,
    TeachingAssignment,
    ClassTeacherAssignment,
    ResultPin,
    Subject,
    ClassSubject,
)
from apps.core.models import Term, SchoolClass, AcademicSession
from .serializers import (
    NoteSerializer,
    ResultSerializer,
    ReportCardSerializer,
    TeachingAssignmentSerializer,
    ResultPinSerializer,
    SubjectSerializer,
    AdminCreateSubjectSerializer,
    AdminUpdateSubjectSerializer,
    ClassSubjectSerializer,
    AdminCreateClassSubjectSerializer,
    AdminUpdateClassSubjectSerializer,
)

from io import BytesIO
from django.conf import settings
import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
)


def teacher_can_handle_class_subject(teacher, class_subject):
    school_class = class_subject.school_class

    teacher_branch_ids = set(teacher.branches.values_list("id", flat=True))
    teacher_section_ids = set(teacher.sections.values_list("id", flat=True))

    # fallback to legacy fields while transition is ongoing
    if not teacher_branch_ids and teacher.branch_id:
        teacher_branch_ids = {teacher.branch_id}

    if not teacher_section_ids and teacher.section_id:
        teacher_section_ids = {teacher.section_id}

    class_branch_ok = school_class.branch_id in teacher_branch_ids
    class_section_ok = school_class.section_id in teacher_section_ids

    return class_branch_ok and class_section_ok

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

        serializer = NoteSerializer(notes, many=True, context={"request": request})
        return Response(serializer.data)
    
class StudentReportCardTraitsView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUserRole]

    def get(self, request, report_card_id):
        student = get_object_or_404(StudentProfile, user=request.user)

        report_card = get_object_or_404(
            ReportCard.objects.prefetch_related("traits"),
            id=report_card_id,
            student=student,
        )

        traits = report_card.traits.all().order_by("trait_type", "name")

        data = [
            {
                "id": trait.id,
                "trait_type": trait.trait_type,
                "name": trait.name,
                "rating": trait.rating,
            }
            for trait in traits
        ]

        return Response(data)


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

        if pin_record.usage_count >= pin_record.max_usage:
            return Response(
                {
                    "detail": "PIN usage limit reached",
                    "usage_count": pin_record.usage_count,
                    "max_usage": pin_record.max_usage,
                    "remaining_uses": 0,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        pin_record.usage_count += 1
        pin_record.save(update_fields=["usage_count"])

        return Response({
            "detail": "PIN verified",
            "usage_count": pin_record.usage_count,
            "max_usage": pin_record.max_usage,
            "remaining_uses": pin_record.remaining_uses,
        })


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


class TeacherNoteUploadView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherUserRole]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        teacher = get_object_or_404(TeacherProfile, user=request.user)

        teaching_assignment_id = request.data.get("teaching_assignment")
        term_id = request.data.get("term")
        title = request.data.get("title")
        file = request.FILES.get("file")

        if not teaching_assignment_id or not term_id or not title or not file:
            return Response(
                {"detail": "teaching_assignment, term, title, and file are required."},
                status=400,
            )

        assignment = get_object_or_404(
            TeachingAssignment,
            id=teaching_assignment_id,
            teacher=teacher,
        )

        term = get_object_or_404(Term, id=term_id)

        note = Note.objects.create(
            teaching_assignment=assignment,
            term=term,
            title=title,
            file=file,
        )

        serializer = NoteSerializer(note, context={"request": request})
        return Response(serializer.data, status=201)
class TermListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        terms = Term.objects.all().order_by("id")
        data = [
            {
                "id": term.id,
                "name": term.get_name_display() if hasattr(term, "get_name_display") else str(term),
            }
            for term in terms
        ]
        return Response(data)
    
class TeacherResultUploadView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherUserRole]

    def post(self, request):
        teacher = get_object_or_404(TeacherProfile, user=request.user)

        teaching_assignment_id = request.data.get("teaching_assignment")
        student_id = request.data.get("student")
        term_id = request.data.get("term")
        continuous_assessment = request.data.get("continuous_assessment")
        exam_score = request.data.get("exam_score")

        if not all([
            teaching_assignment_id,
            student_id,
            term_id,
            continuous_assessment is not None,
            exam_score is not None,
        ]):
            return Response(
                {
                    "detail": (
                        "teaching_assignment, student, term, "
                        "continuous_assessment, and exam_score are required."
                    )
                },
                status=400,
            )

        assignment = get_object_or_404(
            TeachingAssignment,
            id=teaching_assignment_id,
            teacher=teacher,
        )

        student = get_object_or_404(StudentProfile, id=student_id)
        term = get_object_or_404(Term, id=term_id)

        school_class = assignment.class_subject.school_class

        is_enrolled = StudentEnrollment.objects.filter(
            student=student,
            school_class=school_class,
            is_active=True,
        ).exists()

        if not is_enrolled:
            return Response(
                {"detail": "Selected student is not in this assigned class."},
                status=400,
            )

        result, created = Result.objects.update_or_create(
            student=student,
            teaching_assignment=assignment,
            term=term,
            defaults={
                "continuous_assessment": continuous_assessment,
                "exam_score": exam_score,
            },
        )

        serializer = ResultSerializer(result)
        return Response(
            serializer.data,
            status=201 if created else 200,
        )
    
class TeacherAssignmentStudentsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherUserRole]

    def get(self, request):
        teacher = get_object_or_404(TeacherProfile, user=request.user)
        teaching_assignment_id = request.GET.get("teaching_assignment")

        if not teaching_assignment_id:
            return Response(
                {"detail": "teaching_assignment query parameter is required."},
                status=400,
            )

        assignment = get_object_or_404(
            TeachingAssignment,
            id=teaching_assignment_id,
            teacher=teacher,
        )

        school_class = assignment.class_subject.school_class

        enrollments = StudentEnrollment.objects.filter(
            school_class=school_class,
            is_active=True,
        ).select_related("student__user")

        data = [
            {
                "id": enrollment.student.id,
                "student_name": enrollment.student.user.full_name or enrollment.student.user.username,
                "admission_number": enrollment.student.admission_number,
            }
            for enrollment in enrollments
        ]

        return Response(data)
    
class TeacherClassTeacherAssignmentsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherUserRole]

    def get(self, request):
        teacher = get_object_or_404(TeacherProfile, user=request.user)

        assignments = ClassTeacherAssignment.objects.filter(
            teacher=teacher
        ).select_related(
            "school_class",
            "school_class__branch",
            "school_class__section",
            "session",
        ).order_by("school_class__name", "school_class__arm")

        data = [
            {
                "id": assignment.id,
                "school_class": assignment.school_class.id,
                "class_name": assignment.school_class.name,
                "class_arm": assignment.school_class.arm,
                "branch_name": assignment.school_class.branch.name if assignment.school_class.branch else None,
                "section_name": assignment.school_class.section.name if assignment.school_class.section else None,
                "session": assignment.session.id,
                "session_name": assignment.session.name,
                "display_name": (
                    f"{assignment.school_class.name}"
                    f"{f' {assignment.school_class.arm}' if assignment.school_class.arm else ''}"
                    f" - {assignment.session.name}"
                ),
            }
            for assignment in assignments
        ]

        return Response(data)
    
class TeacherClassTeacherAssignmentStudentsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherUserRole]

    def get(self, request, assignment_id):
        teacher = get_object_or_404(TeacherProfile, user=request.user)
        term_id = request.GET.get("term")

        if not term_id:
            return Response({"detail": "term query parameter is required."}, status=400)

        assignment = get_object_or_404(
            ClassTeacherAssignment.objects.select_related("school_class", "session"),
            id=assignment_id,
            teacher=teacher,
        )

        term = get_object_or_404(Term, id=term_id, session=assignment.session)

        enrollments = StudentEnrollment.objects.filter(
            school_class=assignment.school_class,
            session=assignment.session,
            is_active=True,
        ).select_related(
            "student__user",
            "student__branch",
            "student__section",
        ).order_by("student__user__full_name", "student__user__username")

        data = []

        for enrollment in enrollments:
            student = enrollment.student

            report_card, _ = ReportCard.objects.get_or_create(
                student=student,
                term=term,
            )

            results = Result.objects.filter(
                student=student,
                term=term,
                teaching_assignment__class_subject__school_class=assignment.school_class,
            ).select_related(
                "teaching_assignment__class_subject__subject"
            )

            total_score = sum(float(result.total_score) for result in results)
            average_score = round(total_score / results.count(), 2) if results.exists() else 0

            data.append({
               "student_id": student.id,
                "student_name": student.user.full_name or student.user.username,
                "admission_number": student.admission_number,
                "report_card_id": report_card.id,
                "class_teacher_remark": report_card.class_teacher_remark,
                "head_teacher_remark": report_card.head_teacher_remark,
                "performance_rating": report_card.performance_rating,
                "average_score": average_score,
                "times_school_opened": report_card.times_school_opened,
                "times_present": report_card.times_present,
                "times_absent": report_card.times_absent,
                "attendance_percentage": report_card.attendance_percentage,
                "position_in_class": report_card.position_in_class,
                "number_on_roll": report_card.number_on_roll,
                "promoted_to": report_card.promoted_to,
                "next_term_begins": report_card.next_term_begins,
                "vacation_date": report_card.vacation_date,
                "section_name": enrollment.school_class.section.name if enrollment.school_class.section else None,
            })

        return Response({
            "assignment": {
                "id": assignment.id,
                "class_name": assignment.school_class.name,
                "class_arm": assignment.school_class.arm,
                "session_name": assignment.session.name,
            },
            "term": {
                "id": term.id,
                "name": term.get_name_display() if hasattr(term, "get_name_display") else str(term),
            },
            "students": data,
        })
        
class TeacherUpdateClassTeacherRemarkView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherUserRole]

    def put(self, request, report_card_id):
        teacher = get_object_or_404(TeacherProfile, user=request.user)

        report_card = get_object_or_404(
            ReportCard.objects.select_related("student", "term", "student__user"),
            id=report_card_id,
        )

        enrollment = StudentEnrollment.objects.filter(
            student=report_card.student,
            session=report_card.term.session,
            is_active=True,
        ).select_related("school_class", "session", "school_class__section").first()

        if not enrollment:
            return Response(
                {"detail": "No active enrollment found for this student in the report card session."},
                status=400,
            )

        is_class_teacher = ClassTeacherAssignment.objects.filter(
            teacher=teacher,
            school_class=enrollment.school_class,
            session=enrollment.session,
        ).exists()

        if not is_class_teacher:
            return Response(
                {"detail": "You are not the assigned class teacher for this student's class."},
                status=403,
            )

        report_card.class_teacher_remark = request.data.get("class_teacher_remark", "").strip() or None
        report_card.times_school_opened = request.data.get("times_school_opened") or None
        report_card.times_present = request.data.get("times_present") or None
        report_card.times_absent = request.data.get("times_absent") or None
        report_card.attendance_percentage = request.data.get("attendance_percentage") or None
        report_card.position_in_class = request.data.get("position_in_class", "").strip() or None
        report_card.number_on_roll = request.data.get("number_on_roll") or None
        report_card.promoted_to = request.data.get("promoted_to", "").strip() or None
        report_card.next_term_begins = request.data.get("next_term_begins") or None
        report_card.vacation_date = request.data.get("vacation_date") or None

        report_card.save()

        return Response({
            "message": "Class teacher report card details updated successfully.",
            "report_card_id": report_card.id,
            "class_teacher_remark": report_card.class_teacher_remark,
            "times_school_opened": report_card.times_school_opened,
            "times_present": report_card.times_present,
            "times_absent": report_card.times_absent,
            "attendance_percentage": report_card.attendance_percentage,
            "position_in_class": report_card.position_in_class,
            "number_on_roll": report_card.number_on_roll,
            "promoted_to": report_card.promoted_to,
            "next_term_begins": report_card.next_term_begins,
            "vacation_date": report_card.vacation_date,
        })
        
class TeacherReportCardTraitsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherUserRole]

    def get(self, request, report_card_id):
        teacher = get_object_or_404(TeacherProfile, user=request.user)

        report_card = get_object_or_404(
            ReportCard.objects.select_related("student", "term"),
            id=report_card_id,
        )

        enrollment = StudentEnrollment.objects.filter(
            student=report_card.student,
            session=report_card.term.session,
            is_active=True,
        ).select_related("school_class", "session", "school_class__section").first()

        if not enrollment:
            return Response({"detail": "No active enrollment found."}, status=400)

        is_class_teacher = ClassTeacherAssignment.objects.filter(
            teacher=teacher,
            school_class=enrollment.school_class,
            session=enrollment.session,
        ).exists()

        if not is_class_teacher:
            return Response({"detail": "You are not the assigned class teacher for this class."}, status=403)

        section_name = enrollment.school_class.section.name.lower() if enrollment.school_class.section else ""
        if "secondary" in section_name:
            return Response({"detail": "Traits are only available for primary or nursery classes."}, status=400)

        traits = ReportCardTrait.objects.filter(report_card=report_card).order_by("trait_type", "name")

        data = [
            {
                "id": trait.id,
                "trait_type": trait.trait_type,
                "name": trait.name,
                "rating": trait.rating,
            }
            for trait in traits
        ]

        return Response(data)
    
class TeacherUpdateReportCardTraitsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherUserRole]

    def put(self, request, report_card_id):
        teacher = get_object_or_404(TeacherProfile, user=request.user)

        report_card = get_object_or_404(
            ReportCard.objects.select_related("student", "term"),
            id=report_card_id,
        )

        enrollment = StudentEnrollment.objects.filter(
            student=report_card.student,
            session=report_card.term.session,
            is_active=True,
        ).select_related("school_class", "session", "school_class__section").first()

        if not enrollment:
            return Response({"detail": "No active enrollment found."}, status=400)

        is_class_teacher = ClassTeacherAssignment.objects.filter(
            teacher=teacher,
            school_class=enrollment.school_class,
            session=enrollment.session,
        ).exists()

        if not is_class_teacher:
            return Response({"detail": "You are not the assigned class teacher for this class."}, status=403)

        section_name = enrollment.school_class.section.name.lower() if enrollment.school_class.section else ""
        if "secondary" in section_name:
            return Response({"detail": "Traits are only available for primary or nursery classes."}, status=400)

        traits = request.data.get("traits", [])

        if not isinstance(traits, list):
            return Response({"detail": "traits must be a list."}, status=400)

        updated = []

        for item in traits:
            trait_type = item.get("trait_type")
            name = item.get("name")
            rating = item.get("rating")

            if not trait_type or not name:
                continue

            trait, _ = ReportCardTrait.objects.update_or_create(
                report_card=report_card,
                trait_type=trait_type,
                name=name,
                defaults={"rating": rating},
            )

            updated.append({
                "id": trait.id,
                "trait_type": trait.trait_type,
                "name": trait.name,
                "rating": trait.rating,
            })

        return Response({
            "message": "Traits updated successfully.",
            "traits": updated,
        })

class AdminClassTeacherAssignmentListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        assignments = ClassTeacherAssignment.objects.select_related(
            "teacher",
            "teacher__user",
            "school_class",
            "school_class__branch",
            "session",
        ).order_by("school_class__name", "school_class__arm")

        data = [
            {
                "id": item.id,
                "teacher": item.teacher.id,
                "teacher_name": item.teacher.user.full_name or item.teacher.user.username,
                "school_class": item.school_class.id,
                "class_name": item.school_class.name,
                "class_arm": item.school_class.arm,
                "branch_name": item.school_class.branch.name if item.school_class.branch else None,
                "session": item.session.id,
                "session_name": item.session.name,
            }
            for item in assignments
        ]
        return Response(data)

    def post(self, request):
        teacher_id = request.data.get("teacher")
        school_class_id = request.data.get("school_class")
        session_id = request.data.get("session")

        if not teacher_id or not school_class_id or not session_id:
            return Response(
                {"detail": "teacher, school_class, and session are required."},
                status=400,
            )

        teacher = get_object_or_404(
            TeacherProfile.objects.prefetch_related("branches", "sections"),
            id=teacher_id
        )
        school_class = get_object_or_404(
            SchoolClass.objects.select_related("branch", "section"),
            id=school_class_id
        )
        session = get_object_or_404(AcademicSession, id=session_id)

        teacher_branch_ids = set(teacher.branches.values_list("id", flat=True))
        teacher_section_ids = set(teacher.sections.values_list("id", flat=True))

        if not teacher_branch_ids and teacher.branch_id:
            teacher_branch_ids = {teacher.branch_id}

        if not teacher_section_ids and teacher.section_id:
            teacher_section_ids = {teacher.section_id}

        if school_class.branch_id not in teacher_branch_ids:
            return Response(
                {"detail": "This teacher cannot be assigned to this class because of branch mismatch."},
                status=400,
            )

        if school_class.section_id not in teacher_section_ids:
            return Response(
                {"detail": "This teacher cannot be assigned to this class because of section mismatch."},
                status=400,
            )

        assignment, created = ClassTeacherAssignment.objects.update_or_create(
            school_class=school_class,
            session=session,
            defaults={"teacher": teacher},
        )

        return Response(
            {
                "message": "Class teacher assigned successfully." if created else "Class teacher updated successfully.",
                "id": assignment.id,
            },
            status=201 if created else 200,
        )
        
class AdminClassTeacherAssignmentUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def put(self, request, assignment_id):
        assignment = get_object_or_404(ClassTeacherAssignment, id=assignment_id)

        teacher_id = request.data.get("teacher")
        school_class_id = request.data.get("school_class")
        session_id = request.data.get("session")

        if not teacher_id or not school_class_id or not session_id:
            return Response(
                {"detail": "teacher, school_class, and session are required."},
                status=400,
            )

        teacher = get_object_or_404(
            TeacherProfile.objects.prefetch_related("branches", "sections"),
            id=teacher_id
        )
        school_class = get_object_or_404(
            SchoolClass.objects.select_related("branch", "section"),
            id=school_class_id
        )
        session = get_object_or_404(AcademicSession, id=session_id)

        teacher_branch_ids = set(teacher.branches.values_list("id", flat=True))
        teacher_section_ids = set(teacher.sections.values_list("id", flat=True))

        if not teacher_branch_ids and teacher.branch_id:
            teacher_branch_ids = {teacher.branch_id}

        if not teacher_section_ids and teacher.section_id:
            teacher_section_ids = {teacher.section_id}

        if school_class.branch_id not in teacher_branch_ids:
            return Response(
                {"detail": "This teacher cannot be assigned to this class because of branch mismatch."},
                status=400,
            )

        if school_class.section_id not in teacher_section_ids:
            return Response(
                {"detail": "This teacher cannot be assigned to this class because of section mismatch."},
                status=400,
            )

        exists = ClassTeacherAssignment.objects.exclude(id=assignment.id).filter(
            school_class=school_class,
            session=session,
        ).exists()

        if exists:
            return Response(
                {"detail": "A class teacher already exists for this class and session."},
                status=400,
            )

        assignment.teacher = teacher
        assignment.school_class = school_class
        assignment.session = session
        assignment.save()

        return Response({"message": "Class teacher assignment updated successfully."}, status=200)

    def delete(self, request, assignment_id):
        assignment = get_object_or_404(ClassTeacherAssignment, id=assignment_id)
        assignment.delete()
        return Response({"message": "Class teacher assignment deleted successfully."}, status=200)
    
class AdminUpdateHeadTeacherRemarkView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def put(self, request, report_card_id):
        report_card = get_object_or_404(ReportCard, id=report_card_id)

        report_card.head_teacher_remark = request.data.get("head_teacher_remark", "").strip() or None
        report_card.performance_rating = request.data.get("performance_rating", "").strip() or None
        report_card.save(update_fields=["head_teacher_remark", "performance_rating"])

        return Response({
            "message": "Head teacher remark updated successfully.",
            "report_card_id": report_card.id,
            "head_teacher_remark": report_card.head_teacher_remark,
            "performance_rating": report_card.performance_rating,
        })
class AdminReportCardsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        term_id = request.GET.get("term")
        class_id = request.GET.get("class")
        session_id = request.GET.get("session")

        queryset = ReportCard.objects.select_related(
            "student__user",
            "term",
            "term__session",
        ).order_by("student__user__full_name", "student__user__username")

        if term_id:
            queryset = queryset.filter(term_id=term_id)

        if class_id:
            queryset = queryset.filter(
                student__enrollments__school_class_id=class_id,
                student__enrollments__is_active=True,
            )

        if session_id:
            queryset = queryset.filter(term__session_id=session_id)

        queryset = queryset.distinct()

        data = [
            {
                "id": rc.id,
                "student_id": rc.student.id,
                "student_name": rc.student.user.full_name or rc.student.user.username,
                "admission_number": rc.student.admission_number,
                "term_id": rc.term.id,
                "term_name": rc.term.get_name_display() if hasattr(rc.term, "get_name_display") else str(rc.term),

                "class_teacher_remark": rc.class_teacher_remark,
                "head_teacher_remark": rc.head_teacher_remark,
                "performance_rating": rc.performance_rating,

                "times_school_opened": rc.times_school_opened,
                "times_present": rc.times_present,
                "times_absent": rc.times_absent,
                "attendance_percentage": rc.attendance_percentage,

                "position_in_class": rc.position_in_class,
                "number_on_roll": rc.number_on_roll,

                "promoted_to": rc.promoted_to,
                "next_term_begins": rc.next_term_begins,
                "vacation_date": rc.vacation_date,
            }
            for rc in queryset
        ]

        return Response(data)

        
class AdminResultPinListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        pins = ResultPin.objects.select_related(
            "student__user",
            "term",
        ).order_by("-created_at")

        serializer = ResultPinSerializer(pins, many=True)
        return Response(serializer.data)

    def post(self, request):
        student_id = request.data.get("student")
        term_id = request.data.get("term")

        if not student_id or not term_id:
            return Response(
                {"detail": "student and term are required."},
                status=400,
            )

        student = get_object_or_404(StudentProfile, id=student_id)
        term = get_object_or_404(Term, id=term_id)

        existing_pin = ResultPin.objects.filter(
            student=student,
            term=term,
        ).first()

        if existing_pin:
            serializer = ResultPinSerializer(existing_pin)
            return Response(
                {
                    "detail": "A PIN already exists for this student and term.",
                    "pin": serializer.data,
                },
                status=200,
            )

        pin = ResultPin.objects.create(
            student=student,
            term=term,
        )

        serializer = ResultPinSerializer(pin)
        return Response(serializer.data, status=201)
    
class AdminSubjectListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        subjects = Subject.objects.all().order_by("name")
        data = [
            {
                "id": subject.id,
                "name": subject.name,
                "code": subject.code,
            }
            for subject in subjects
        ]
        return Response(data)


class AdminSubjectCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def post(self, request):
        serializer = AdminCreateSubjectSerializer(data=request.data)
        if serializer.is_valid():
            subject = serializer.save()
            return Response(
                {
                    "message": "Subject created successfully.",
                    "subject": SubjectSerializer(subject).data,
                },
                status=201,
            )
        return Response(serializer.errors, status=400)


class AdminSubjectUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def put(self, request, subject_id):
        subject = get_object_or_404(Subject, id=subject_id)
        serializer = AdminUpdateSubjectSerializer(
            subject,
            data=request.data,
            context={"subject": subject},
        )
        if serializer.is_valid():
            updated_subject = serializer.save()
            return Response(
                {
                    "message": "Subject updated successfully.",
                    "subject": SubjectSerializer(updated_subject).data,
                },
                status=200,
            )
        return Response(serializer.errors, status=400)


class AdminClassSubjectListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        class_subjects = ClassSubject.objects.select_related(
            "subject",
            "school_class",
            "school_class__branch",
            "session",
        ).order_by("school_class__name", "school_class__arm", "subject__name")

        data = [
            {
                "id": item.id,
                "subject_name": item.subject.name,
                "subject_code": item.subject.code,
                "class_name": item.school_class.name,
                "class_arm": item.school_class.arm,
                "branch_name": item.school_class.branch.name if item.school_class.branch else None,
                "session_name": item.session.name if item.session else None,
                "display_name": (
                    f"{item.subject.name}"
                    f"{f' ({item.subject.code})' if item.subject.code else ''} - "
                    f"{item.school_class.name}"
                    f"{f' {item.school_class.arm}' if item.school_class.arm else ''} - "
                    f"{item.session.name}"
                ),
            }
            for item in class_subjects
        ]

        return Response(data)
    
class AdminManagedClassSubjectListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        class_subjects = ClassSubject.objects.select_related(
            "subject",
            "school_class",
            "school_class__branch",
            "session",
        ).order_by(
            "school_class__name",
            "school_class__arm",
            "subject__name",
            "session__name",
        )

        serializer = ClassSubjectSerializer(class_subjects, many=True)
        return Response(serializer.data)


class AdminClassSubjectCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def post(self, request):
        serializer = AdminCreateClassSubjectSerializer(data=request.data)
        if serializer.is_valid():
            class_subject = serializer.save()
            return Response(
                {
                    "message": "Class subject created successfully.",
                    "class_subject": ClassSubjectSerializer(class_subject).data,
                },
                status=201,
            )
        return Response(serializer.errors, status=400)


class AdminClassSubjectUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def put(self, request, class_subject_id):
        class_subject = get_object_or_404(ClassSubject, id=class_subject_id)
        serializer = AdminUpdateClassSubjectSerializer(
            class_subject,
            data=request.data,
            context={"class_subject": class_subject},
        )
        if serializer.is_valid():
            updated_item = serializer.save()
            return Response(
                {
                    "message": "Class subject updated successfully.",
                    "class_subject": ClassSubjectSerializer(updated_item).data,
                },
                status=200,
            )
        return Response(serializer.errors, status=400)


class AdminAssignmentListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        assignments = TeachingAssignment.objects.select_related(
            "teacher",
            "teacher__user",
            "class_subject",
            "class_subject__subject",
            "class_subject__school_class",
            "class_subject__school_class__branch",
            "class_subject__session",
        ).order_by("teacher__user__full_name")

        data = [
            {
                "id": item.id,
                "teacher": item.teacher.id,
                "teacher_name": item.teacher.user.full_name or item.teacher.user.username,
                "class_subject": item.class_subject.id,
                "subject_name": item.class_subject.subject.name,
                "subject_code": item.class_subject.subject.code,
                "class_name": item.class_subject.school_class.name,
                "class_arm": item.class_subject.school_class.arm,
                "branch_name": item.class_subject.school_class.branch.name
                if item.class_subject.school_class.branch
                else None,
                "session_name": item.class_subject.session.name
                if item.class_subject.session
                else None,
            }
            for item in assignments
        ]

        return Response(data)


class AdminAssignmentCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def post(self, request):
        teacher_id = request.data.get("teacher")
        class_subject_id = request.data.get("class_subject")

        if not teacher_id or not class_subject_id:
            return Response(
                {"detail": "teacher and class_subject are required."},
                status=400,
            )

        teacher = get_object_or_404(
            TeacherProfile.objects.prefetch_related("branches", "sections"),
            id=teacher_id
        )
        class_subject = get_object_or_404(
            ClassSubject.objects.select_related("school_class", "school_class__branch", "school_class__section"),
            id=class_subject_id
        )

        if not teacher_can_handle_class_subject(teacher, class_subject):
            return Response(
                {
                    "detail": (
                        "This teacher cannot be assigned to the selected class subject "
                        "because the class branch/section is outside the teacher's allowed branches/sections."
                    )
                },
                status=400,
            )

        exists = TeachingAssignment.objects.filter(
            teacher=teacher,
            class_subject=class_subject,
        ).exists()

        if exists:
            return Response(
                {"detail": "This teacher is already assigned to that class subject."},
                status=400,
            )

        assignment = TeachingAssignment.objects.create(
            teacher=teacher,
            class_subject=class_subject,
        )

        return Response(
            {"message": "Assignment created successfully.", "id": assignment.id},
            status=201,
        )


class AdminAssignmentUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def put(self, request, assignment_id):
        assignment = get_object_or_404(TeachingAssignment, id=assignment_id)

        teacher_id = request.data.get("teacher")
        class_subject_id = request.data.get("class_subject")

        if not teacher_id or not class_subject_id:
            return Response(
                {"detail": "teacher and class_subject are required."},
                status=400,
            )

        teacher = get_object_or_404(
            TeacherProfile.objects.prefetch_related("branches", "sections"),
            id=teacher_id
        )
        class_subject = get_object_or_404(
            ClassSubject.objects.select_related("school_class", "school_class__branch", "school_class__section"),
            id=class_subject_id
        )

        if not teacher_can_handle_class_subject(teacher, class_subject):
            return Response(
                {
                    "detail": (
                        "This teacher cannot be assigned to the selected class subject "
                        "because the class branch/section is outside the teacher's allowed branches/sections."
                    )
                },
                status=400,
            )

        exists = TeachingAssignment.objects.exclude(id=assignment.id).filter(
            teacher=teacher,
            class_subject=class_subject,
        ).exists()

        if exists:
            return Response(
                {"detail": "This teacher is already assigned to that class subject."},
                status=400,
            )

        assignment.teacher = teacher
        assignment.class_subject = class_subject
        assignment.save()

        return Response({"message": "Assignment updated successfully."}, status=200)    

        
def get_grade(total):
    total = float(total)
    if total >= 75:
        return "A"
    if total >= 65:
        return "B"
    if total >= 50:
        return "C"
    if total >= 40:
        return "D"
    return "F"

class StudentReportCardHTMLView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUserRole]

    def get(self, request):
        term_name = request.GET.get("term")

        student = get_object_or_404(StudentProfile, user=request.user)
        enrollment = StudentEnrollment.objects.filter(
            student=student,
            is_active=True
        ).select_related("school_class", "session").first()

        if not enrollment:
            return Response({"detail": "No active enrollment found."}, status=404)

        results_qs = Result.objects.filter(student=student).select_related(
            "teaching_assignment__class_subject__subject",
            "term",
        )

        report_cards_qs = ReportCard.objects.filter(student=student).select_related("term")

        if term_name and term_name != "All":
            normalized_term = term_name.lower().split()[0]
            results_qs = results_qs.filter(term__name=normalized_term)
            report_card = report_cards_qs.filter(term__name=normalized_term).first()
        else:
            report_card = report_cards_qs.first()

        results = []
        total_sum = 0

        for result in results_qs:
            total = float(result.total_score)
            total_sum += total
            results.append({
                "subject_name": result.teaching_assignment.class_subject.subject.name,
                "continuous_assessment": result.continuous_assessment,
                "exam_score": result.exam_score,
                "total_score": total,
                "grade": get_grade(total),
            })

        average_score = round(total_sum / len(results), 2) if results else 0

        context = {
            "school_name": "Re-Invent Schools",
            "student_name": student.user.full_name,
            "admission_number": student.admission_number,
            "branch_name": student.branch.name if student.branch else "N/A",
            "section_name": student.section.name if student.section else "N/A",
            "class_name": f"{enrollment.school_class.name} {enrollment.school_class.arm or ''}".strip(),
            "session_name": enrollment.session.name,
            "term_name": report_card.term.get_name_display() if report_card else term_name or "N/A",
            "average_score": average_score,
            "results": results,
            "class_teacher_remark": report_card.class_teacher_remark if report_card else None,
            "head_teacher_remark": report_card.head_teacher_remark if report_card else None,
            "performance_rating": report_card.performance_rating if report_card else None,
        }

        html_string = render_to_string("academics/report_card.html", context)
        return HttpResponse(html_string)
    
class StudentReportCardPDFView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUserRole]

    def get(self, request, report_card_id=None):
        term_name = request.GET.get("term")

        student = get_object_or_404(StudentProfile, user=request.user)
        enrollment = StudentEnrollment.objects.filter(
            student=student,
            is_active=True
        ).select_related(
            "school_class",
            "school_class__section",
            "school_class__branch",
            "session",
        ).first()

        if not enrollment:
            return Response({"detail": "No active enrollment found."}, status=404)

        results_qs = Result.objects.filter(student=student).select_related(
            "teaching_assignment__class_subject__subject",
            "term",
        )

        report_cards_qs = ReportCard.objects.filter(student=student).select_related(
            "term",
            "term__session",
        ).prefetch_related("traits")

        if report_card_id:
            report_card = get_object_or_404(report_cards_qs, id=report_card_id)
            results_qs = results_qs.filter(term_id=report_card.term_id)
        elif term_name and term_name != "All":
            normalized_term = term_name.lower().split()[0]
            
            report_card = report_cards_qs.filter(
                Q(term__name__iexact=term_name)
                | Q(term__name__iexact=normalized_term)
                | Q(term__name__icontains=normalized_term)
            ).first()
            
            if not report_card:
                return Response(
                    {"detail": "No report card found for the selected term."},
                    status=404,
                )
            
            results_qs = results_qs.filter(term_id=report_card.term_id)
        else:
            report_card = report_cards_qs.first()
            
            if report_card:
                results_qs = results_qs.filter(term_id=report_card.term_id)
        

        results = []
        total_sum = 0

        for index, result in enumerate(results_qs, start=1):
            total = float(result.total_score)
            total_sum += total
            results.append({
                "sn": index,
                "subject_name": result.teaching_assignment.class_subject.subject.name,
                "continuous_assessment": float(result.continuous_assessment),
                "exam_score": float(result.exam_score),
                "total_score": total,
                "grade": get_grade(total),
                "remark": self.get_remark(total),
            })

        average_score = round(total_sum / len(results), 2) if results else 0

        section_name = (
            enrollment.school_class.section.name.lower()
            if enrollment.school_class and enrollment.school_class.section
            else ""
        )

        if "secondary" in section_name:
            pdf_bytes = self.build_secondary_pdf(
                student=student,
                enrollment=enrollment,
                report_card=report_card,
                results=results,
                average_score=average_score,
            )
        else:
            pdf_bytes = self.build_primary_pdf(
                student=student,
                enrollment=enrollment,
                report_card=report_card,
                results=results,
                average_score=average_score,
            )

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="report_card.pdf"'
        return response

    def build_secondary_pdf(self, student, enrollment, report_card, results, average_score):
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=18,
            leftMargin=18,
            topMargin=18,
            bottomMargin=18,
        )

        styles = getSampleStyleSheet()
        story = []

        school_name_style = ParagraphStyle(
            "SchoolNameSecondary",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=20,
            alignment=1,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=2,
        )

        school_info_style = ParagraphStyle(
            "SchoolInfoSecondary",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            alignment=1,
            textColor=colors.HexColor("#475569"),
        )

        report_band_style = ParagraphStyle(
            "ReportBandSecondary",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            alignment=1,
            textColor=colors.white,
        )

        section_title_style = ParagraphStyle(
            "SectionTitleSecondary",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=colors.HexColor("#1e3a8a"),
            spaceAfter=4,
        )

        label_style = ParagraphStyle(
            "SecondaryLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#0f172a"),
        )

        value_style = ParagraphStyle(
            "SecondaryValue",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#1f2937"),
        )

        centered_value_style = ParagraphStyle(
            "SecondaryCenteredValue",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            alignment=1,
            textColor=colors.HexColor("#1f2937"),
        )

        card_caption_style = ParagraphStyle(
            "CardCaptionSecondary",
            parent=styles["Normal"],
            fontSize=7,
            leading=9,
            alignment=1,
            textColor=colors.HexColor("#dbeafe"),
        )

        card_value_style = ParagraphStyle(
            "CardValueSecondary",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=15,
            alignment=1,
            textColor=colors.white,
        )

        footer_note_style = ParagraphStyle(
            "FooterNoteSecondary",
            parent=styles["Normal"],
            fontSize=7,
            leading=9,
            alignment=1,
            textColor=colors.HexColor("#64748b"),
        )

        self.add_school_header(
            story=story,
            school_name_style=school_name_style,
            school_info_style=school_info_style,
            report_title_style=report_band_style,
            report_card=report_card,
            theme="secondary",
        )

        # Top highlight cards
        top_cards = Table(
            [[
                self.make_highlight_card("AVERAGE SCORE", f"{average_score}%", card_caption_style, card_value_style, "#1d4ed8"),
                self.make_highlight_card("PERFORMANCE RATING", report_card.performance_rating or "-", card_caption_style, card_value_style, "#4f46e5"),
            ]],
            colWidths=[257, 257],
        )
        top_cards.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(top_cards)
        story.append(Spacer(1, 10))

        class_name = f"{enrollment.school_class.name} {enrollment.school_class.arm or ''}".strip()
        session_name = enrollment.session.name if enrollment.session else "-"
        student_name = student.user.full_name or student.user.username
        term_display = report_card.term.get_name_display() if hasattr(report_card.term, "get_name_display") else str(report_card.term)

        story.append(Paragraph("Student Information", section_title_style))

        student_info_data = [
            [
                Paragraph("Student Name", label_style),
                Paragraph(student_name, value_style),
                Paragraph("Term", label_style),
                Paragraph(term_display, value_style),
            ],
            [
                Paragraph("Admission No", label_style),
                Paragraph(student.admission_number or "-", value_style),
                Paragraph("Session", label_style),
                Paragraph(session_name, value_style),
            ],
            [
                Paragraph("Class", label_style),
                Paragraph(class_name, value_style),
                Paragraph("Section", label_style),
                Paragraph(student.section.name if student.section else "-", value_style),
            ],
            [
                Paragraph("Branch", label_style),
                Paragraph(student.branch.name if student.branch else "-", value_style),
                Paragraph("Gender", label_style),
                Paragraph(student.gender or "-", value_style),
            ],
        ]

        student_info_table = Table(student_info_data, colWidths=[90, 168, 90, 167])
        student_info_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#cbd5e1")),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eff6ff")),
            ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#eff6ff")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(student_info_table)
        story.append(Spacer(1, 10))

        story.append(Paragraph("Academic Summary", section_title_style))

        summary_data = [
            [
                Paragraph("Position in Class", label_style),
                Paragraph(report_card.get_position_display(), centered_value_style),
                Paragraph("Number on Roll", label_style),
                Paragraph(str(report_card.number_on_roll or "-"), centered_value_style),
            ],
            [
                Paragraph("Promoted To", label_style),
                Paragraph(report_card.promoted_to or "-", centered_value_style),
                Paragraph("Attendance %", label_style),
                Paragraph(
                    str(report_card.attendance_percentage)
                    if report_card.attendance_percentage is not None else "-",
                    centered_value_style,
                ),
            ],
            [
                Paragraph("Next Term Begins", label_style),
                Paragraph(
                    report_card.next_term_begins.strftime("%Y-%m-%d")
                    if report_card.next_term_begins else "-",
                    centered_value_style,
                ),
                Paragraph("Vacation Date", label_style),
                Paragraph(
                    report_card.vacation_date.strftime("%Y-%m-%d")
                    if report_card.vacation_date else "-",
                    centered_value_style,
                ),
            ],
        ]

        summary_table = Table(summary_data, colWidths=[110, 100, 110, 100])
        summary_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#cbd5e1")),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef2ff")),
            ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#eef2ff")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 10))

        story.append(Paragraph("Academic Performance", section_title_style))

        results_data = [["S/N", "Subject", "CA", "Exam", "Total", "Grade", "Remark"]]
        if results:
            for item in results:
                results_data.append([
                    str(item["sn"]),
                    item["subject_name"],
                    self.format_number(item["continuous_assessment"]),
                    self.format_number(item["exam_score"]),
                    self.format_number(item["total_score"]),
                    item["grade"],
                    item["remark"],
                ])
        else:
            results_data.append(["-", "No results available", "-", "-", "-", "-", "-"])

        results_table = Table(
            results_data,
            colWidths=[28, 176, 42, 42, 50, 42, 139],
            repeatRows=1,
        )
        results_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1d4ed8")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
            ("ALIGN", (2, 1), (5, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(results_table)
        story.append(Spacer(1, 10))

        story.append(Paragraph("Remarks", section_title_style))

        remarks_data = [
            [
                Paragraph("Class Teacher Remark", label_style),
                Paragraph(report_card.class_teacher_remark or "No remark available.", value_style),
            ],
            [
                Paragraph("Head Teacher Remark", label_style),
                Paragraph(report_card.head_teacher_remark or "No remark available.", value_style),
            ],
        ]

        remarks_table = Table(remarks_data, colWidths=[150, 364])
        remarks_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#cbd5e1")),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eff6ff")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]))
        story.append(remarks_table)
        story.append(Spacer(1, 12))

        signature_table = Table(
            [[
                Paragraph("____________________________<br/><b>Class Teacher Signature</b>", centered_value_style),
                Paragraph("____________________________<br/><b>Head Teacher Signature</b>", centered_value_style),
            ]],
            colWidths=[257, 257],
        )
        signature_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(signature_table)

        story.append(Spacer(1, 12))
        story.append(
            Paragraph(
                "This report card is not valid without the official school stamp and authorized signature.",
                footer_note_style,
            )
        )

        doc.build(story)
        pdf = buffer.getvalue()
        buffer.close()
        return pdf

    def build_primary_pdf(self, student, enrollment, report_card, results, average_score):
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=18,
            leftMargin=18,
            topMargin=18,
            bottomMargin=18,
        )

        styles = getSampleStyleSheet()
        story = []

        school_name_style = ParagraphStyle(
            "SchoolNamePrimary",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=20,
            alignment=1,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=2,
        )

        school_info_style = ParagraphStyle(
            "SchoolInfoPrimary",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            alignment=1,
            textColor=colors.HexColor("#475569"),
        )

        report_band_style = ParagraphStyle(
            "ReportBandPrimary",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            alignment=1,
            textColor=colors.white,
        )

        section_title_style = ParagraphStyle(
            "SectionTitlePrimary",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=colors.HexColor("#be185d"),
            spaceAfter=4,
        )

        label_style = ParagraphStyle(
            "PrimaryLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#0f172a"),
        )

        value_style = ParagraphStyle(
            "PrimaryValue",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#1f2937"),
        )

        centered_value_style = ParagraphStyle(
            "PrimaryCenteredValue",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            alignment=1,
            textColor=colors.HexColor("#1f2937"),
        )

        card_caption_style = ParagraphStyle(
            "CardCaptionPrimary",
            parent=styles["Normal"],
            fontSize=7,
            leading=9,
            alignment=1,
            textColor=colors.HexColor("#fdf2f8"),
        )

        card_value_style = ParagraphStyle(
            "CardValuePrimary",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=15,
            alignment=1,
            textColor=colors.white,
        )

        footer_note_style = ParagraphStyle(
            "FooterNotePrimary",
            parent=styles["Normal"],
            fontSize=7,
            leading=9,
            alignment=1,
            textColor=colors.HexColor("#64748b"),
        )

        self.add_school_header(
            story=story,
            school_name_style=school_name_style,
            school_info_style=school_info_style,
            report_title_style=report_band_style,
            report_card=report_card,
            theme="primary",
        )

        top_cards = Table(
            [[
                self.make_highlight_card("AVERAGE SCORE", f"{average_score}%", card_caption_style, card_value_style, "#db2777"),
                self.make_highlight_card("PERFORMANCE RATING", report_card.performance_rating or "-", card_caption_style, card_value_style, "#f59e0b"),
            ]],
            colWidths=[257, 257],
        )
        top_cards.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(top_cards)
        story.append(Spacer(1, 10))

        class_name = f"{enrollment.school_class.name} {enrollment.school_class.arm or ''}".strip()
        session_name = enrollment.session.name if enrollment.session else "-"
        student_name = student.user.full_name or student.user.username
        term_display = report_card.term.get_name_display() if hasattr(report_card.term, "get_name_display") else str(report_card.term)

        story.append(Paragraph("Student Information", section_title_style))

        student_info_data = [
            [
                Paragraph("Student Name", label_style),
                Paragraph(student_name, value_style),
                Paragraph("Admission No", label_style),
                Paragraph(student.admission_number or "-", value_style),
            ],
            [
                Paragraph("Class", label_style),
                Paragraph(class_name, value_style),
                Paragraph("Session", label_style),
                Paragraph(session_name, value_style),
            ],
            [
                Paragraph("Section", label_style),
                Paragraph(student.section.name if student.section else "-", value_style),
                Paragraph("Term", label_style),
                Paragraph(term_display, value_style),
            ],
            [
                Paragraph("Branch", label_style),
                Paragraph(student.branch.name if student.branch else "-", value_style),
                Paragraph("Gender", label_style),
                Paragraph(student.gender or "-", value_style),
            ],
        ]

        student_info_table = Table(student_info_data, colWidths=[90, 160, 90, 174])
        student_info_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#fbcfe8")),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#fdf2f8")),
            ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#fff7ed")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(student_info_table)
        story.append(Spacer(1, 10))

        story.append(Paragraph("Attendance and Promotion Summary", section_title_style))

        summary_data = [
            [
                Paragraph("Times School Opened", label_style),
                Paragraph(str(report_card.times_school_opened or "-"), centered_value_style),
                Paragraph("Times Present", label_style),
                Paragraph(str(report_card.times_present or "-"), centered_value_style),
            ],
            [
                Paragraph("Times Absent", label_style),
                Paragraph(str(report_card.times_absent or "-"), centered_value_style),
                Paragraph("Attendance %", label_style),
                Paragraph(
                    str(report_card.attendance_percentage)
                    if report_card.attendance_percentage is not None else "-",
                    centered_value_style,
                ),
            ],
            [
                Paragraph("Position in Class", label_style),
                Paragraph(report_card.get_position_display(), centered_value_style),
                Paragraph("Number on Roll", label_style),
                Paragraph(str(report_card.number_on_roll or "-"), centered_value_style),
            ],
            [
                Paragraph("Promoted To", label_style),
                Paragraph(report_card.promoted_to or "-", centered_value_style),
                Paragraph("Next Term Begins", label_style),
                Paragraph(
                    report_card.next_term_begins.strftime("%Y-%m-%d")
                    if report_card.next_term_begins else "-",
                    centered_value_style,
                ),
            ],
            [
                Paragraph("Vacation Date", label_style),
                Paragraph(
                    report_card.vacation_date.strftime("%Y-%m-%d")
                    if report_card.vacation_date else "-",
                    centered_value_style,
                ),
                Paragraph("", label_style),
                Paragraph("", centered_value_style),
            ],
        ]

        summary_table = Table(summary_data, colWidths=[115, 92, 115, 110])
        summary_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#fed7aa")),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#fff7ed")),
            ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#fdf2f8")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 10))

        story.append(Paragraph("Academic Performance", section_title_style))

        results_data = [["S/N", "Subject", "CA", "Exam", "Total", "Grade", "Remark"]]
        if results:
            for item in results:
                results_data.append([
                    str(item["sn"]),
                    item["subject_name"],
                    self.format_number(item["continuous_assessment"]),
                    self.format_number(item["exam_score"]),
                    self.format_number(item["total_score"]),
                    item["grade"],
                    item["remark"],
                ])
        else:
            results_data.append(["-", "No results available", "-", "-", "-", "-", "-"])

        results_table = Table(
            results_data,
            colWidths=[28, 176, 42, 42, 50, 42, 139],
            repeatRows=1,
        )
        results_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#db2777")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fbcfe8")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fff7ed")]),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
            ("ALIGN", (2, 1), (5, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(results_table)
        story.append(Spacer(1, 10))

        story.append(Paragraph("Remarks", section_title_style))

        remarks_data = [
            [
                Paragraph("Class Teacher Remark", label_style),
                Paragraph(report_card.class_teacher_remark or "No remark available.", value_style),
            ],
            [
                Paragraph("Head Teacher Remark", label_style),
                Paragraph(report_card.head_teacher_remark or "No remark available.", value_style),
            ],
            [
                Paragraph("Performance Rating", label_style),
                Paragraph(report_card.performance_rating or "-", value_style),
            ],
        ]

        remarks_table = Table(remarks_data, colWidths=[150, 364])
        remarks_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#fbcfe8")),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#fdf2f8")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]))
        story.append(remarks_table)
        story.append(Spacer(1, 10))

        story.append(Paragraph("Traits Assessment", section_title_style))
        traits_wrapper = self.build_traits_tables(report_card)
        story.append(traits_wrapper)
        story.append(Spacer(1, 12))

        signature_table = Table(
            [[
                Paragraph("____________________________<br/><b>Class Teacher Signature</b>", centered_value_style),
                Paragraph("____________________________<br/><b>Head Teacher Signature</b>", centered_value_style),
            ]],
            colWidths=[257, 257],
        )
        signature_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(signature_table)

        story.append(Spacer(1, 12))
        story.append(
            Paragraph(
                "This report card is not valid without the official school stamp and authorized signature.",
                footer_note_style,
            )
        )

        doc.build(story)
        pdf = buffer.getvalue()
        buffer.close()
        return pdf

    def add_school_header(self, story, school_name_style, school_info_style, report_title_style, report_card, theme="secondary"):
        school_name = "RE-INVENT SCHOOLS"
        school_address_1 = "14, Adesholarin Street, Lame Bus Stop, Igando New Town"
        school_address_2 = "44, Shobukola Street, Idimu, Ikotun Rd, Lagos"
        school_website = "Website: www.re-inventschools.com"
        school_tel = "Tel: 08103355019, 08030480829, 08037913238"

        logo_path = os.path.join(settings.BASE_DIR, "static", "images", "school-logo.jpeg")
        logo_cell = ""

        if os.path.exists(logo_path):
            logo_cell = Image(logo_path, width=56, height=56)

        header_right = [
            Paragraph(school_name, school_name_style),
            Paragraph(school_address_1, school_info_style),
            Paragraph(school_address_2, school_info_style),
            Paragraph(school_website, school_info_style),
            Paragraph(school_tel, school_info_style),
        ]

        header_table = Table([[logo_cell, header_right]], colWidths=[65, 448])
        header_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (0, 0), "CENTER"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 6))

        term_display = (
            report_card.term.get_name_display().upper()
            if hasattr(report_card.term, "get_name_display")
            else str(report_card.term).upper()
        )

        band_color = colors.HexColor("#1d4ed8") if theme == "secondary" else colors.HexColor("#db2777")
        border_color = colors.HexColor("#1e3a8a") if theme == "secondary" else colors.HexColor("#be185d")

        report_title_table = Table(
            [[Paragraph(f"{term_display} REPORT CARD", report_title_style)]],
            colWidths=[513]
        )
        report_title_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), band_color),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("BOX", (0, 0), (-1, -1), 0.8, border_color),
        ]))
        story.append(report_title_table)
        story.append(Spacer(1, 10))

    def make_highlight_card(self, title, value, caption_style, value_style, hex_color):
        card = Table(
            [[Paragraph(title, caption_style)], [Paragraph(value, value_style)]],
            colWidths=[245],
        )
        card.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(hex_color)),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor(hex_color)),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        return card

    def format_number(self, value):
        value = float(value)
        return f"{value:.0f}" if value.is_integer() else f"{value:.2f}"

    def get_remark(self, total):
        total = float(total)
        if total >= 75:
            return "Excellent"
        if total >= 65:
            return "Very Good"
        if total >= 50:
            return "Good"
        if total >= 40:
            return "Fair"
        return "Poor"

    def get_trait_map(self, report_card):
        traits = report_card.traits.all()

        psychomotor_defaults = [
            "Handwriting",
            "Verbal Fluency",
            "Games",
            "Sports",
            "Handling Tools",
            "Drawing & Painting",
            "Musical Skills",
        ]

        affective_defaults = [
            "Punctuality",
            "Neatness",
            "Politeness",
            "Honesty",
            "Co-operation",
            "Leadership",
            "Helping Others",
            "Emotional Stability",
            "Health",
            "Attitude to School Work",
            "Attentiveness",
            "Perseverance",
        ]

        psychomotor_map = {name: "-" for name in psychomotor_defaults}
        affective_map = {name: "-" for name in affective_defaults}

        for trait in traits:
            if trait.trait_type == "psychomotor":
                psychomotor_map[trait.name] = trait.rating or "-"
            elif trait.trait_type == "affective":
                affective_map[trait.name] = trait.rating or "-"

        return psychomotor_map, affective_map

    def build_traits_tables(self, report_card):
        psychomotor_map, affective_map = self.get_trait_map(report_card)

        psychomotor_data = [["Psychomotor Skills", "Rating"]]
        for name, value in psychomotor_map.items():
            psychomotor_data.append([name, value])

        psychomotor_table = Table(psychomotor_data, colWidths=[180, 45])
        psychomotor_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fbcfe8")),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#db2777")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fdf2f8")]),
            ("ALIGN", (1, 1), (1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))

        affective_data = [["Affective Traits", "Rating"]]
        for name, value in affective_map.items():
            affective_data.append([name, value])

        affective_table = Table(affective_data, colWidths=[245, 45])
        affective_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fed7aa")),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f59e0b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fff7ed")]),
            ("ALIGN", (1, 1), (1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))

        traits_wrapper = Table([[psychomotor_table, affective_table]], colWidths=[230, 283])
        traits_wrapper.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        return traits_wrapper