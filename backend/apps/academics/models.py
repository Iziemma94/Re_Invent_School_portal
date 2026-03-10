# Create your models here.

from django.db import models
import uuid


class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class ClassSubject(models.Model):
    school_class = models.ForeignKey(
        "core.SchoolClass",
        on_delete=models.CASCADE,
        related_name="class_subjects"
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="class_subjects"
    )
    session = models.ForeignKey(
        "core.AcademicSession",
        on_delete=models.CASCADE,
        related_name="class_subjects"
    )

    class Meta:
        unique_together = ("school_class", "subject", "session")
        ordering = ["school_class", "subject"]

    def __str__(self):
        return f"{self.school_class} - {self.subject} ({self.session})"


class TeachingAssignment(models.Model):
    teacher = models.ForeignKey(
        "students.TeacherProfile",
        on_delete=models.CASCADE,
        related_name="teaching_assignments"
    )
    class_subject = models.ForeignKey(
        ClassSubject,
        on_delete=models.CASCADE,
        related_name="teaching_assignments"
    )

    class Meta:
        unique_together = ("teacher", "class_subject")
        ordering = ["teacher"]

    def __str__(self):
        return (
            f"{self.teacher} teaches "
            f"{self.class_subject.subject} in "
            f"{self.class_subject.school_class}"
        )


class ClassTeacherAssignment(models.Model):
    teacher = models.ForeignKey(
        "students.TeacherProfile",
        on_delete=models.CASCADE,
        related_name="class_teacher_assignments"
    )
    school_class = models.ForeignKey(
        "core.SchoolClass",
        on_delete=models.CASCADE,
        related_name="class_teacher_assignments"
    )
    session = models.ForeignKey(
        "core.AcademicSession",
        on_delete=models.CASCADE,
        related_name="class_teacher_assignments"
    )

    class Meta:
        unique_together = ("school_class", "session")
        ordering = ["school_class"]

    def __str__(self):
        return f"{self.teacher} is class teacher of {self.school_class} ({self.session})"


class Note(models.Model):
    title = models.CharField(max_length=200)
    teaching_assignment = models.ForeignKey(
        TeachingAssignment,
        on_delete=models.CASCADE,
        related_name="notes"
    )
    term = models.ForeignKey(
        "core.Term",
        on_delete=models.CASCADE,
        related_name="notes"
    )
    file = models.FileField(upload_to="notes/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.title


class Result(models.Model):
    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.CASCADE,
        related_name="results"
    )
    teaching_assignment = models.ForeignKey(
        TeachingAssignment,
        on_delete=models.CASCADE,
        related_name="results"
    )
    term = models.ForeignKey(
        "core.Term",
        on_delete=models.CASCADE,
        related_name="results"
    )
    continuous_assessment = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    exam_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student", "teaching_assignment", "term")
        ordering = ["student"]

    @property
    def total_score(self):
        return self.continuous_assessment + self.exam_score

    def __str__(self):
        return f"{self.student} - {self.teaching_assignment.class_subject.subject} - {self.term}"


class ReportCard(models.Model):
    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.CASCADE,
        related_name="report_cards"
    )
    term = models.ForeignKey(
        "core.Term",
        on_delete=models.CASCADE,
        related_name="report_cards"
    )
    class_teacher_remark = models.TextField(blank=True, null=True)
    head_teacher_remark = models.TextField(blank=True, null=True)
    performance_rating = models.CharField(max_length=50, blank=True, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "term")
        ordering = ["-generated_at"]

    def __str__(self):
        return f"{self.student} - {self.term}"


class ResultPin(models.Model):
    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.CASCADE,
        related_name="result_pins"
    )
    term = models.ForeignKey(
        "core.Term",
        on_delete=models.CASCADE,
        related_name="result_pins"
    )
    pin = models.CharField(max_length=12, unique=True, blank=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "term")
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.pin:
            self.pin = uuid.uuid4().hex[:12].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} - {self.term} - {self.pin}"