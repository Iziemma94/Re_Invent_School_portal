from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsStudentUserRole, IsAdminUserRole
from apps.students.models import StudentProfile

from .models import FeeStructure, StudentFee, StudentPayment
from .serializers import (
    FeeStructureSerializer,
    StudentFeeSerializer,
    StudentPaymentSerializer,
)


class StudentFeesView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUserRole]

    def get(self, request):
        student = StudentProfile.objects.get(user=request.user)

        student_fees = StudentFee.objects.select_related(
            "fee_structure",
            "fee_structure__term",
        ).prefetch_related("payments").filter(student=student)

        data = [
            {
                "id": fee.id,
                "fee_name": fee.fee_structure.name,
                "fee_amount": fee.fee_structure.amount,
                "total_paid": fee.total_paid,
                "balance": fee.balance,
                "term_name": fee.fee_structure.term.get_name_display()
                if fee.fee_structure.term
                else "-",
            }
            for fee in student_fees
        ]

        return Response(data)


class AdminFeeListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        student_fees = StudentFee.objects.select_related(
            "student__user",
            "fee_structure",
            "fee_structure__term",
            "fee_structure__school_class",
            "fee_structure__branch",
            "fee_structure__section",
        ).prefetch_related("payments").order_by("-id")

        data = [
            {
                "id": fee.id,
                "student_name": fee.student.user.full_name or fee.student.user.username,
                "admission_number": fee.student.admission_number,
                "term_name": fee.fee_structure.term.get_name_display()
                if fee.fee_structure.term
                else "-",
                "session_name": "-",
                "fee_name": fee.fee_structure.name,
                "class_name": fee.fee_structure.school_class.name
                if fee.fee_structure.school_class
                else "-",
                "branch_name": fee.fee_structure.branch.name
                if fee.fee_structure.branch
                else "-",
                "section_name": fee.fee_structure.section.name
                if fee.fee_structure.section
                else "-",
                "amount_paid": fee.total_paid,
                "total_amount": fee.fee_structure.amount,
                "outstanding": fee.balance,
            }
            for fee in student_fees
        ]

        return Response(data)


class AdminFeeStructureListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        fee_structures = FeeStructure.objects.select_related(
            "branch",
            "section",
            "school_class",
            "term",
        ).order_by("-id")
        serializer = FeeStructureSerializer(fee_structures, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = FeeStructureSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Fee structure created successfully.",
                    "fee_structure": serializer.data,
                },
                status=201,
            )
        return Response(serializer.errors, status=400)


class AdminFeeStructureUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def put(self, request, fee_structure_id):
        fee_structure = get_object_or_404(FeeStructure, id=fee_structure_id)
        serializer = FeeStructureSerializer(fee_structure, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Fee structure updated successfully.",
                    "fee_structure": serializer.data,
                },
                status=200,
            )
        return Response(serializer.errors, status=400)


class AdminStudentFeeAssignListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        student_fees = StudentFee.objects.select_related(
            "student__user",
            "fee_structure",
            "fee_structure__term",
            "fee_structure__school_class",
            "fee_structure__branch",
            "fee_structure__section",
        ).prefetch_related("payments").order_by("-id")

        serializer = StudentFeeSerializer(student_fees, many=True)
        return Response(serializer.data)

    def post(self, request):
        student_id = request.data.get("student")
        fee_structure_id = request.data.get("fee_structure")

        if not student_id or not fee_structure_id:
            return Response(
                {"detail": "student and fee_structure are required."},
                status=400,
            )

        student = get_object_or_404(StudentProfile, id=student_id)
        fee_structure = get_object_or_404(FeeStructure, id=fee_structure_id)

        student_fee, created = StudentFee.objects.get_or_create(
            student=student,
            fee_structure=fee_structure,
        )

        if not created:
            return Response(
                {"detail": "This fee structure has already been assigned to the student."},
                status=400,
            )

        serializer = StudentFeeSerializer(student_fee)
        return Response(
            {
                "message": "Fee assigned to student successfully.",
                "student_fee": serializer.data,
            },
            status=201,
        )


class AdminStudentFeeUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def put(self, request, student_fee_id):
        student_fee = get_object_or_404(StudentFee, id=student_fee_id)

        student_id = request.data.get("student")
        fee_structure_id = request.data.get("fee_structure")

        if not student_id or not fee_structure_id:
            return Response(
                {"detail": "student and fee_structure are required."},
                status=400,
            )

        student = get_object_or_404(StudentProfile, id=student_id)
        fee_structure = get_object_or_404(FeeStructure, id=fee_structure_id)

        existing = StudentFee.objects.filter(
            student=student,
            fee_structure=fee_structure,
        ).exclude(id=student_fee.id).first()

        if existing:
            return Response(
                {"detail": "This fee structure is already assigned to the student."},
                status=400,
            )

        student_fee.student = student
        student_fee.fee_structure = fee_structure
        student_fee.save()

        serializer = StudentFeeSerializer(student_fee)
        return Response(
            {
                "message": "Assigned fee updated successfully.",
                "student_fee": serializer.data,
            },
            status=200,
        )


class AdminStudentPaymentListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        payments = StudentPayment.objects.select_related(
            "student_fee__student__user",
            "student_fee__fee_structure",
        ).order_by("-payment_date", "-id")

        serializer = StudentPaymentSerializer(payments, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = StudentPaymentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Payment recorded successfully.",
                    "payment": serializer.data,
                },
                status=201,
            )
        return Response(serializer.errors, status=400)