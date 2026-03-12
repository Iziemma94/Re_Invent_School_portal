from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsStudentUserRole
from apps.students.models import StudentProfile

from .models import StudentFee
from .serializers import StudentFeeSerializer


class StudentFeesView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUserRole]

    def get(self, request):
        student = get_object_or_404(StudentProfile, user=request.user)
        fees = StudentFee.objects.filter(student=student).select_related(
            "fee_structure",
            "fee_structure__term",
            "student__user",
        ).prefetch_related("payments")
        serializer = StudentFeeSerializer(fees, many=True)
        return Response(serializer.data)