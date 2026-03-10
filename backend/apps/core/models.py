# Create your models here.

from django.db import models


class Branch(models.Model):
    name = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Section(models.Model):
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class AcademicSession(models.Model):
    name = models.CharField(max_length=20, unique=True)  # e.g. 2025/2026
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return self.name


class Term(models.Model):
    TERM_CHOICES = (
        ("first", "First Term"),
        ("second", "Second Term"),
        ("third", "Third Term"),
    )

    name = models.CharField(max_length=20, choices=TERM_CHOICES)
    session = models.ForeignKey(AcademicSession, on_delete=models.CASCADE, related_name="terms")
    is_active = models.BooleanField(default=False)

    class Meta:
        unique_together = ("name", "session")
        ordering = ["session", "name"]

    def __str__(self):
        return f"{self.get_name_display()} - {self.session.name}"


class SchoolClass(models.Model):
    name = models.CharField(max_length=50)  # e.g. Primary 4, JSS1, SS2
    arm = models.CharField(max_length=10, blank=True, null=True)  # e.g. A, B
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="classes")
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="classes")

    class Meta:
        unique_together = ("name", "arm", "branch", "section")
        ordering = ["section__name", "name", "arm"]

    def __str__(self):
        arm_display = f" {self.arm}" if self.arm else ""
        return f"{self.name}{arm_display} - {self.branch.name}"