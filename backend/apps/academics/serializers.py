from rest_framework import serializers
from .models import (
    Subject,
    ClassSubject,
    TeachingAssignment,
    Note,
    Result,
    ReportCard,
    ResultPin,
)


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name", "code"]


class ClassSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_name = serializers.CharField(source="school_class.name", read_only=True)
    class_arm = serializers.CharField(source="school_class.arm", read_only=True)
    session_name = serializers.CharField(source="session.name", read_only=True)

    class Meta:
        model = ClassSubject
        fields = [
            "id",
            "school_class",
            "class_name",
            "class_arm",
            "subject",
            "subject_name",
            "session",
            "session_name",
        ]


class TeachingAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.user.full_name", read_only=True)
    subject_name = serializers.CharField(source="class_subject.subject.name", read_only=True)
    class_name = serializers.CharField(source="class_subject.school_class.name", read_only=True)
    class_arm = serializers.CharField(source="class_subject.school_class.arm", read_only=True)

    class Meta:
        model = TeachingAssignment
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "class_subject",
            "subject_name",
            "class_name",
            "class_arm",
        ]


class NoteSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="teaching_assignment.class_subject.subject.name", read_only=True)
    teacher_name = serializers.CharField(source="teaching_assignment.teacher.user.full_name", read_only=True)
    class_name = serializers.CharField(source="teaching_assignment.class_subject.school_class.name", read_only=True)
    class_arm = serializers.CharField(source="teaching_assignment.class_subject.school_class.arm", read_only=True)
    term_name = serializers.CharField(source="term.get_name_display", read_only=True)

    class Meta:
        model = Note
        fields = [
            "id",
            "title",
            "teaching_assignment",
            "subject_name",
            "teacher_name",
            "class_name",
            "class_arm",
            "term",
            "term_name",
            "file",
            "uploaded_at",
        ]


class ResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    subject_name = serializers.CharField(source="teaching_assignment.class_subject.subject.name", read_only=True)
    teacher_name = serializers.CharField(source="teaching_assignment.teacher.user.full_name", read_only=True)
    term_name = serializers.CharField(source="term.get_name_display", read_only=True)
    total_score = serializers.ReadOnlyField()

    class Meta:
        model = Result
        fields = [
            "id",
            "student",
            "student_name",
            "teaching_assignment",
            "subject_name",
            "teacher_name",
            "term",
            "term_name",
            "continuous_assessment",
            "exam_score",
            "total_score",
            "created_at",
            "updated_at",
        ]


class ReportCardSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    term_name = serializers.CharField(source="term.get_name_display", read_only=True)

    class Meta:
        model = ReportCard
        fields = [
            "id",
            "student",
            "student_name",
            "term",
            "term_name",
            "class_teacher_remark",
            "head_teacher_remark",
            "performance_rating",
            "generated_at",
        ]


class ResultPinSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    term_name = serializers.CharField(source="term.get_name_display", read_only=True)

    class Meta:
        model = ResultPin
        fields = [
            "id",
            "student",
            "student_name",
            "term",
            "term_name",
            "pin",
            "is_used",
            "created_at",
        ]
        read_only_fields = ["pin", "created_at"]