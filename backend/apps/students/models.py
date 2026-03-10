# Create your models here.
from django.db import models


class StudentProfile(models.Model):
    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="student_profile"
    )

    admission_number = models.CharField(max_length=30, unique=True)

    date_of_birth = models.DateField(null=True, blank=True)

    gender = models.CharField(max_length=10, blank=True)

    branch = models.ForeignKey(
        "core.Branch",
        on_delete=models.SET_NULL,
        null=True
    )

    section = models.ForeignKey(
        "core.Section",
        on_delete=models.SET_NULL,
        null=True
    )

    def __str__(self):
        return self.user.full_name

class TeacherProfile(models.Model):
    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="teacher_profile"
    )

    staff_id = models.CharField(max_length=30, unique=True)

    branch = models.ForeignKey(
        "core.Branch",
        on_delete=models.SET_NULL,
        null=True
    )

    section = models.ForeignKey(
        "core.Section",
        on_delete=models.SET_NULL,
        null=True
    )

    def __str__(self):
        return self.user.full_name

class StudentEnrollment(models.Model):
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )

    school_class = models.ForeignKey(
        "core.SchoolClass",
        on_delete=models.CASCADE
    )

    session = models.ForeignKey(
        "core.AcademicSession",
        on_delete=models.CASCADE
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("student", "session")

    def __str__(self):
        return f"{self.student} -> {self.school_class} ({self.session})"