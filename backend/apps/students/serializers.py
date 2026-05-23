from rest_framework import serializers
from .models import StudentProfile, TeacherProfile, StudentEnrollment
from django.db import transaction
from apps.accounts.models import User


class StudentProfileSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source="user.full_name", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    profile_picture = serializers.ImageField(source="user.profile_picture", read_only=True)
    branch_name = serializers.SerializerMethodField()
    section_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user",
            "username",
            "user_full_name",
            "profile_picture",
            "admission_number",
            "date_of_birth",
            "gender",
            "branch",
            "branch_name",
            "section",
            "section_name",
        ]

    def get_branch_name(self, obj):
        return obj.branch.name if obj.branch else None

    def get_section_name(self, obj):
        return obj.section.name if obj.section else None


class TeacherProfileSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source="user.full_name", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    profile_picture = serializers.ImageField(source="user.profile_picture", read_only=True)
    branch_names = serializers.SerializerMethodField()
    section_names = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = [
            "id",
            "user",
            "username",
            "user_full_name",
            "profile_picture",
            "staff_id",
            "branch_names",
            "section_names",
        ]

    def get_branch_names(self, obj):
        names = list(obj.branches.values_list("name", flat=True))
        if names:
            return names
        return [obj.branch.name] if obj.branch else []

    def get_section_names(self, obj):
        names = list(obj.sections.values_list("name", flat=True))
        if names:
            return names
        return [obj.section.name] if obj.section else []


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    class_name = serializers.CharField(source="school_class.name", read_only=True)
    class_arm = serializers.CharField(source="school_class.arm", read_only=True)
    session_name = serializers.CharField(source="session.name", read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = [
            "id",
            "student",
            "student_name",
            "school_class",
            "class_name",
            "class_arm",
            "session",
            "session_name",
            "is_active",
        ]


class AdminCreateStudentSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    admission_number = serializers.CharField(max_length=30)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(max_length=10, required=False, allow_blank=True)

    branch = serializers.IntegerField()
    section = serializers.IntegerField()
    school_class = serializers.IntegerField()
    session = serializers.IntegerField()

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_admission_number(self, value):
        if StudentProfile.objects.filter(admission_number=value).exists():
            raise serializers.ValidationError("This admission number already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        from apps.core.models import Branch, Section, SchoolClass, AcademicSession

        branch_id = validated_data.pop("branch")
        section_id = validated_data.pop("section")
        school_class_id = validated_data.pop("school_class")
        session_id = validated_data.pop("session")

        password = validated_data.pop("password")
        profile_picture = validated_data.pop("profile_picture", None)

        branch = Branch.objects.get(id=branch_id)
        section = Section.objects.get(id=section_id)
        school_class = SchoolClass.objects.get(id=school_class_id)
        session = AcademicSession.objects.get(id=session_id)

        user = User.objects.create_user(
            username=validated_data["username"],
            password=password,
            full_name=validated_data["full_name"],
            phone_number=validated_data.get("phone_number", ""),
            role="student",
            profile_picture=profile_picture,
        )

        student_profile = StudentProfile.objects.create(
            user=user,
            admission_number=validated_data["admission_number"],
            date_of_birth=validated_data.get("date_of_birth"),
            gender=validated_data.get("gender", ""),
            branch=branch,
            section=section,
        )

        StudentEnrollment.objects.create(
            student=student_profile,
            school_class=school_class,
            session=session,
            is_active=True,
        )

        return student_profile

    def to_representation(self, instance):
        return StudentProfileSerializer(instance).data


class AdminCreateTeacherSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    staff_id = serializers.CharField(max_length=30)
    branches = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    sections = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_staff_id(self, value):
        if TeacherProfile.objects.filter(staff_id=value).exists():
            raise serializers.ValidationError("This staff ID already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        from apps.core.models import Branch, Section

        branch_ids = validated_data.pop("branches", [])
        section_ids = validated_data.pop("sections", [])
        password = validated_data.pop("password")
        profile_picture = validated_data.pop("profile_picture", None)

        user = User.objects.create_user(
            username=validated_data["username"],
            password=password,
            full_name=validated_data["full_name"],
            phone_number=validated_data.get("phone_number", ""),
            role="teacher",
            profile_picture=profile_picture,
        )

        teacher_profile = TeacherProfile.objects.create(
            user=user,
            staff_id=validated_data["staff_id"],
        )

        if branch_ids:
            branches = Branch.objects.filter(id__in=branch_ids)
            teacher_profile.branches.set(branches)

            first_branch = branches.first()
            if first_branch:
                teacher_profile.branch = first_branch

        if section_ids:
            sections = Section.objects.filter(id__in=section_ids)
            teacher_profile.sections.set(sections)

            first_section = sections.first()
            if first_section:
                teacher_profile.section = first_section

        teacher_profile.save()
        return teacher_profile

    def to_representation(self, instance):
        return TeacherProfileSerializer(instance).data


class AdminUpdateStudentSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    admission_number = serializers.CharField(max_length=30)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(max_length=10, required=False, allow_blank=True)

    branch = serializers.IntegerField()
    section = serializers.IntegerField()
    school_class = serializers.IntegerField()
    session = serializers.IntegerField()

    def validate_username(self, value):
        student = self.context["student"]
        if User.objects.exclude(id=student.user_id).filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_admission_number(self, value):
        student = self.context["student"]
        if StudentProfile.objects.exclude(id=student.id).filter(admission_number=value).exists():
            raise serializers.ValidationError("This admission number already exists.")
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        from apps.core.models import Branch, Section, SchoolClass, AcademicSession

        branch = Branch.objects.get(id=validated_data["branch"])
        section = Section.objects.get(id=validated_data["section"])
        school_class = SchoolClass.objects.get(id=validated_data["school_class"])
        session = AcademicSession.objects.get(id=validated_data["session"])
        profile_picture = validated_data.get("profile_picture", None)

        user = instance.user
        user.full_name = validated_data["full_name"]
        user.username = validated_data["username"]
        user.phone_number = validated_data.get("phone_number", "")
        if profile_picture is not None:
            user.profile_picture = profile_picture

        user.save()

        instance.admission_number = validated_data["admission_number"]
        instance.date_of_birth = validated_data.get("date_of_birth")
        instance.gender = validated_data.get("gender", "")
        instance.branch = branch
        instance.section = section
        instance.save()

        enrollment = StudentEnrollment.objects.filter(
            student=instance,
            is_active=True
        ).first()

        if enrollment:
            enrollment.school_class = school_class
            enrollment.session = session
            enrollment.save()
        else:
            StudentEnrollment.objects.create(
                student=instance,
                school_class=school_class,
                session=session,
                is_active=True,
            )

        return instance


class AdminUpdateTeacherSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    staff_id = serializers.CharField(max_length=30)
    branches = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    sections = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )

    def validate_username(self, value):
        teacher = self.context["teacher"]
        if User.objects.exclude(id=teacher.user_id).filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_staff_id(self, value):
        teacher = self.context["teacher"]
        if TeacherProfile.objects.exclude(id=teacher.id).filter(staff_id=value).exists():
            raise serializers.ValidationError("This staff ID already exists.")
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        from apps.core.models import Branch, Section

        branch_ids = validated_data.pop("branches", [])
        section_ids = validated_data.pop("sections", [])

        user = instance.user
        user.full_name = validated_data["full_name"]
        user.username = validated_data["username"]
        user.phone_number = validated_data.get("phone_number", "")

        profile_picture = validated_data.get("profile_picture", None)
        if profile_picture is not None:
            user.profile_picture = profile_picture

        user.save()

        instance.staff_id = validated_data["staff_id"]

        if branch_ids:
            branches = Branch.objects.filter(id__in=branch_ids)
            instance.branches.set(branches)

            first_branch = branches.first()
            instance.branch = first_branch if first_branch else None
        else:
            instance.branches.clear()
            instance.branch = None

        if section_ids:
            sections = Section.objects.filter(id__in=section_ids)
            instance.sections.set(sections)

            first_section = sections.first()
            instance.section = first_section if first_section else None
        else:
            instance.sections.clear()
            instance.section = None

        instance.save()
        return instance