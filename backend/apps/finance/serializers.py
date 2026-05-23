from rest_framework import serializers
from .models import FeeStructure, StudentFee, StudentPayment


class FeeStructureSerializer(serializers.ModelSerializer):
    term_name = serializers.CharField(source="term.get_name_display", read_only=True)
    class_name = serializers.CharField(source="school_class.name", read_only=True)
    class_arm = serializers.CharField(source="school_class.arm", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    section_name = serializers.CharField(source="section.name", read_only=True)

    class Meta:
        model = FeeStructure
        fields = [
            "id",
            "branch",
            "branch_name",
            "section",
            "section_name",
            "school_class",
            "class_name",
            "class_arm",
            "term",
            "term_name",
            "name",
            "amount",
        ]


class StudentPaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student_fee.student.user.full_name", read_only=True)
    fee_name = serializers.CharField(source="student_fee.fee_structure.name", read_only=True)

    class Meta:
        model = StudentPayment
        fields = [
            "id",
            "student_fee",
            "student_name",
            "fee_name",
            "amount_paid",
            "payment_date",
            "reference",
        ]


class StudentFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    admission_number = serializers.CharField(source="student.admission_number", read_only=True)
    fee_name = serializers.CharField(source="fee_structure.name", read_only=True)
    fee_amount = serializers.DecimalField(
        source="fee_structure.amount",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    term_name = serializers.CharField(source="fee_structure.term.get_name_display", read_only=True)
    class_name = serializers.CharField(source="fee_structure.school_class.name", read_only=True)
    class_arm = serializers.CharField(source="fee_structure.school_class.arm", read_only=True)
    branch_name = serializers.CharField(source="fee_structure.branch.name", read_only=True)
    section_name = serializers.CharField(source="fee_structure.section.name", read_only=True)
    total_paid = serializers.ReadOnlyField()
    balance = serializers.ReadOnlyField()
    payments = StudentPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = StudentFee
        fields = [
            "id",
            "student",
            "student_name",
            "admission_number",
            "fee_structure",
            "fee_name",
            "fee_amount",
            "term_name",
            "class_name",
            "class_arm",
            "branch_name",
            "section_name",
            "assigned_at",
            "total_paid",
            "balance",
            "payments",
        ]