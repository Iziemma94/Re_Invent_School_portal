from rest_framework import serializers
from .models import (
    Note,
    Result,
    ReportCard,
    TeachingAssignment,
    ClassTeacherAssignment,
    ResultPin,
    Subject,
    ClassSubject,
)


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name", "code"]


class ClassSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True,
    )
    subject_code = serializers.CharField(
        source="subject.code",
        read_only=True,
    )

    class_name = serializers.CharField(
        source="school_class.name",
        read_only=True,
    )
    class_arm = serializers.CharField(
        source="school_class.arm",
        read_only=True,
    )

    branch = serializers.IntegerField(
        source="school_class.branch_id",
        read_only=True,
    )
    branch_name = serializers.CharField(
        source="school_class.branch.name",
        read_only=True,
    )

    section = serializers.IntegerField(
        source="school_class.section_id",
        read_only=True,
    )
    section_name = serializers.CharField(
        source="school_class.section.name",
        read_only=True,
    )

    session_name = serializers.CharField(
        source="session.name",
        read_only=True,
    )

    display_name = serializers.SerializerMethodField()

    class Meta:
        model = ClassSubject
        fields = [
            "id",
            "school_class",
            "class_name",
            "class_arm",
            "branch",
            "branch_name",
            "section",
            "section_name",
            "subject",
            "subject_name",
            "subject_code",
            "session",
            "session_name",
            "display_name",
        ]

    def get_display_name(self, obj):
        """Return a readable class-subject description."""
        class_name = obj.school_class.name
        class_arm = obj.school_class.arm or ""
        subject_name = obj.subject.name
        session_name = obj.session.name if obj.session else ""

        full_class_name = f"{class_name} {class_arm}".strip()

        if session_name:
            return f"{subject_name} — {full_class_name} — {session_name}"

        return f"{subject_name} — {full_class_name}"
        

class AdminCreateClassSubjectSerializer(serializers.Serializer):
    school_class = serializers.IntegerField()
    subject = serializers.IntegerField()
    session = serializers.IntegerField()

    def validate(self, attrs):
        from apps.core.models import SchoolClass, AcademicSession

        school_class = SchoolClass.objects.filter(id=attrs["school_class"]).first()
        if not school_class:
            raise serializers.ValidationError({"school_class": ["Selected class does not exist."]})

        subject = Subject.objects.filter(id=attrs["subject"]).first()
        if not subject:
            raise serializers.ValidationError({"subject": ["Selected subject does not exist."]})

        session = AcademicSession.objects.filter(id=attrs["session"]).first()
        if not session:
            raise serializers.ValidationError({"session": ["Selected session does not exist."]})

        exists = ClassSubject.objects.filter(
            school_class=school_class,
            subject=subject,
            session=session,
        ).exists()

        if exists:
            raise serializers.ValidationError(
                {"detail": ["This class subject already exists for the selected session."]}
            )

        return attrs

    def create(self, validated_data):
        from apps.core.models import SchoolClass, AcademicSession

        school_class = SchoolClass.objects.get(id=validated_data["school_class"])
        subject = Subject.objects.get(id=validated_data["subject"])
        session = AcademicSession.objects.get(id=validated_data["session"])

        return ClassSubject.objects.create(
            school_class=school_class,
            subject=subject,
            session=session,
        )

    def to_representation(self, instance):
        return ClassSubjectSerializer(instance).data


class AdminUpdateClassSubjectSerializer(serializers.Serializer):
    school_class = serializers.IntegerField()
    subject = serializers.IntegerField()
    session = serializers.IntegerField()

    def validate(self, attrs):
        from apps.core.models import SchoolClass, AcademicSession

        class_subject = self.context["class_subject"]

        school_class = SchoolClass.objects.filter(id=attrs["school_class"]).first()
        if not school_class:
            raise serializers.ValidationError({"school_class": ["Selected class does not exist."]})

        subject = Subject.objects.filter(id=attrs["subject"]).first()
        if not subject:
            raise serializers.ValidationError({"subject": ["Selected subject does not exist."]})

        session = AcademicSession.objects.filter(id=attrs["session"]).first()
        if not session:
            raise serializers.ValidationError({"session": ["Selected session does not exist."]})

        exists = ClassSubject.objects.exclude(id=class_subject.id).filter(
            school_class=school_class,
            subject=subject,
            session=session,
        ).exists()

        if exists:
            raise serializers.ValidationError(
                {"detail": ["This class subject already exists for the selected session."]}
            )

        return attrs

    def update(self, instance, validated_data):
        from apps.core.models import SchoolClass, AcademicSession

        instance.school_class = SchoolClass.objects.get(id=validated_data["school_class"])
        instance.subject = Subject.objects.get(id=validated_data["subject"])
        instance.session = AcademicSession.objects.get(id=validated_data["session"])
        instance.save()
        return instance

    def to_representation(self, instance):
        return ClassSubjectSerializer(instance).data
        

class AdminCreateSubjectSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    code = serializers.CharField(max_length=30, required=False, allow_blank=True)

    def validate_name(self, value):
        if Subject.objects.filter(name__iexact=value.strip()).exists():
            raise serializers.ValidationError("A subject with this name already exists.")
        return value.strip()

    def validate_code(self, value):
        cleaned = value.strip()
        if cleaned and Subject.objects.filter(code__iexact=cleaned).exists():
            raise serializers.ValidationError("A subject with this code already exists.")
        return cleaned

    def create(self, validated_data):
        return Subject.objects.create(
            name=validated_data["name"],
            code=validated_data.get("code", ""),
        )

    def to_representation(self, instance):
        return SubjectSerializer(instance).data


class AdminUpdateSubjectSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    code = serializers.CharField(max_length=30, required=False, allow_blank=True)

    def validate_name(self, value):
        subject = self.context["subject"]
        cleaned = value.strip()
        if Subject.objects.exclude(id=subject.id).filter(name__iexact=cleaned).exists():
            raise serializers.ValidationError("A subject with this name already exists.")
        return cleaned

    def validate_code(self, value):
        subject = self.context["subject"]
        cleaned = value.strip()
        if cleaned and Subject.objects.exclude(id=subject.id).filter(code__iexact=cleaned).exists():
            raise serializers.ValidationError("A subject with this code already exists.")
        return cleaned

    def update(self, instance, validated_data):
        instance.name = validated_data["name"]
        instance.code = validated_data.get("code", "")
        instance.save()
        return instance

    def to_representation(self, instance):
        return SubjectSerializer(instance).data


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

class ClassTeacherAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.user.full_name", read_only=True)
    class_name = serializers.CharField(source="school_class.name", read_only=True)
    class_arm = serializers.CharField(source="school_class.arm", read_only=True)
    session_name = serializers.CharField(source="session.name", read_only=True)

    class Meta:
        model = ClassTeacherAssignment
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "school_class",
            "class_name",
            "class_arm",
            "session",
            "session_name",
        ]

class NoteSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(
        source="teaching_assignment.class_subject.subject.name",
        read_only=True,
    )
    teacher_name = serializers.CharField(
        source="teaching_assignment.teacher.user.full_name",
        read_only=True,
    )
    class_name = serializers.CharField(
        source="teaching_assignment.class_subject.school_class.name",
        read_only=True,
    )
    class_arm = serializers.CharField(
        source="teaching_assignment.class_subject.school_class.arm",
        read_only=True,
    )
    term_name = serializers.CharField(source="term.get_name_display", read_only=True)
    file = serializers.SerializerMethodField()

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

    def get_file(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        if obj.file:
            return obj.file.url
        return None


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
    remaining_uses = serializers.IntegerField(read_only=True)
    is_used_up = serializers.BooleanField(read_only=True)

    class Meta:
        model = ResultPin
        fields = [
            "id",
            "student",
            "student_name",
            "term",
            "term_name",
            "pin",
            "usage_count",
            "max_usage",
            "remaining_uses",
            "is_used_up",
            "created_at",
        ]
        read_only_fields = [
            "pin",
            "usage_count",
            "max_usage",
            "remaining_uses",
            "is_used_up",
            "created_at",
        ]