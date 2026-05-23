# Create your models here.
from decimal import Decimal, ROUND_HALF_UP
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

    times_school_opened = models.PositiveIntegerField(blank=True, null=True)
    times_present = models.PositiveIntegerField(blank=True, null=True)
    times_absent = models.PositiveIntegerField(blank=True, null=True)
    attendance_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True
    )

    position_in_class = models.CharField(max_length=20, blank=True, null=True)
    number_on_roll = models.PositiveIntegerField(blank=True, null=True)

    promoted_to = models.CharField(max_length=100, blank=True, null=True)
    next_term_begins = models.DateField(blank=True, null=True)
    vacation_date = models.DateField(blank=True, null=True)

    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student", "term")
        ordering = ["-generated_at"]

    def __str__(self):
        return f"{self.student} - {self.term}"

    def calculate_attendance_percentage(self):
        """
        Calculate attendance percentage from times_present and times_school_opened.
        """
        if self.times_school_opened and self.times_present is not None and self.times_school_opened > 0:
            percentage = (Decimal(self.times_present) / Decimal(self.times_school_opened)) * Decimal("100")
            return percentage.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return None

    def sync_attendance_fields(self):
        """
        Keep attendance fields in sync.
        - If times_school_opened and times_present are given, calculate times_absent if missing/misaligned
        - Automatically calculate attendance_percentage
        """
        if (
            self.times_school_opened is not None
            and self.times_present is not None
            and self.times_school_opened >= self.times_present
        ):
            calculated_absent = self.times_school_opened - self.times_present

            if self.times_absent is None or self.times_absent != calculated_absent:
                self.times_absent = calculated_absent

            self.attendance_percentage = self.calculate_attendance_percentage()

    def get_position_display(self):
        """
        Return position with ordinal suffix, e.g. 1 -> 1st, 2 -> 2nd.
        If position_in_class is already text like '1st', return as-is.
        """
        if not self.position_in_class:
            return "-"

        raw = str(self.position_in_class).strip()

        if not raw:
            return "-"

        if not raw.isdigit():
            return raw

        number = int(raw)

        if 10 <= number % 100 <= 20:
            suffix = "th"
        else:
            suffix = {1: "st", 2: "nd", 3: "rd"}.get(number % 10, "th")

        return f"{number}{suffix}"

    def save(self, *args, **kwargs):
        self.sync_attendance_fields()
        super().save(*args, **kwargs)
    

class ReportCardTrait(models.Model):
    TRAIT_TYPE_CHOICES = (
        ("psychomotor", "Psychomotor"),
        ("affective", "Affective"),
    )

    report_card = models.ForeignKey(
        ReportCard,
        on_delete=models.CASCADE,
        related_name="traits"
    )
    trait_type = models.CharField(max_length=20, choices=TRAIT_TYPE_CHOICES)
    name = models.CharField(max_length=100)
    rating = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        unique_together = ("report_card", "trait_type", "name")
        ordering = ["trait_type", "name"]

    def __str__(self):
        return f"{self.report_card} - {self.trait_type} - {self.name}"


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

    usage_count = models.PositiveIntegerField(default=0)
    max_usage = models.PositiveIntegerField(default=3)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "term")
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.pin:
            self.pin = uuid.uuid4().hex[:12].upper()
        super().save(*args, **kwargs)

    @property
    def is_used_up(self):
        return self.usage_count >= self.max_usage

    @property
    def remaining_uses(self):
        return max(self.max_usage - self.usage_count, 0)

    def __str__(self):
        return f"{self.student} - {self.term} - {self.pin}"