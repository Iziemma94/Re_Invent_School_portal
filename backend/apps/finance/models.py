# Create your models here.

from django.db import models


class FeeStructure(models.Model):
    branch = models.ForeignKey(
        "core.Branch",
        on_delete=models.CASCADE,
        related_name="fee_structures"
    )
    section = models.ForeignKey(
        "core.Section",
        on_delete=models.CASCADE,
        related_name="fee_structures"
    )
    school_class = models.ForeignKey(
        "core.SchoolClass",
        on_delete=models.CASCADE,
        related_name="fee_structures"
    )
    term = models.ForeignKey(
        "core.Term",
        on_delete=models.CASCADE,
        related_name="fee_structures"
    )
    name = models.CharField(max_length=100)  # Tuition, ICT, Exam Fee
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ("school_class", "term", "name")
        ordering = ["school_class", "name"]

    def __str__(self):
        return f"{self.name} - {self.school_class} - {self.term}"


class StudentFee(models.Model):
    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.CASCADE,
        related_name="student_fees"
    )
    fee_structure = models.ForeignKey(
        FeeStructure,
        on_delete=models.CASCADE,
        related_name="student_fees"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "fee_structure")
        ordering = ["student"]

    def __str__(self):
        return f"{self.student} - {self.fee_structure}"

    @property
    def total_paid(self):
        return sum(payment.amount_paid for payment in self.payments.all())

    @property
    def balance(self):
        return self.fee_structure.amount - self.total_paid


class StudentPayment(models.Model):
    student_fee = models.ForeignKey(
        StudentFee,
        on_delete=models.CASCADE,
        related_name="payments"
    )
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    reference = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ["-payment_date", "-id"]

    def __str__(self):
        return f"{self.student_fee.student} paid {self.amount_paid}"