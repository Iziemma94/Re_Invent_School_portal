from rest_framework import serializers
from .models import Branch, Section, SchoolClass, AcademicSession, Setting


class SettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setting
        fields = ["id", "category", "key", "value"]
        

class SettingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setting
        fields = ["value"]


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name", "location"]


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ["id", "name"]


class AcademicSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSession
        fields = ["id", "name", "start_date", "end_date", "is_active"]


class SchoolClassSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    section_name = serializers.CharField(source="section.name", read_only=True)

    class Meta:
        model = SchoolClass
        fields = [
            "id",
            "name",
            "arm",
            "branch",
            "branch_name",
            "section",
            "section_name",
        ]


class AdminCreateSchoolClassSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=50)
    arm = serializers.CharField(max_length=10, required=False, allow_blank=True, allow_null=True)
    branch = serializers.IntegerField()
    section = serializers.IntegerField()

    def validate(self, attrs):
        from .models import Branch, Section, SchoolClass

        branch = Branch.objects.filter(id=attrs["branch"]).first()
        if not branch:
            raise serializers.ValidationError({"branch": ["Selected branch does not exist."]})

        section = Section.objects.filter(id=attrs["section"]).first()
        if not section:
            raise serializers.ValidationError({"section": ["Selected section does not exist."]})

        arm = attrs.get("arm") or None

        exists = SchoolClass.objects.filter(
            name=attrs["name"],
            arm=arm,
            branch=branch,
            section=section,
        ).exists()

        if exists:
            raise serializers.ValidationError(
                {"name": ["A class with this name, arm, branch, and section already exists."]}
            )

        return attrs

    def create(self, validated_data):
        from .models import Branch, Section, SchoolClass

        branch = Branch.objects.get(id=validated_data["branch"])
        section = Section.objects.get(id=validated_data["section"])

        school_class = SchoolClass.objects.create(
            name=validated_data["name"],
            arm=validated_data.get("arm") or None,
            branch=branch,
            section=section,
        )
        return school_class

    def to_representation(self, instance):
        return SchoolClassSerializer(instance).data


class AdminUpdateSchoolClassSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=50)
    arm = serializers.CharField(max_length=10, required=False, allow_blank=True, allow_null=True)
    branch = serializers.IntegerField()
    section = serializers.IntegerField()

    def validate(self, attrs):
        from .models import Branch, Section, SchoolClass

        school_class = self.context["school_class"]

        branch = Branch.objects.filter(id=attrs["branch"]).first()
        if not branch:
            raise serializers.ValidationError({"branch": ["Selected branch does not exist."]})

        section = Section.objects.filter(id=attrs["section"]).first()
        if not section:
            raise serializers.ValidationError({"section": ["Selected section does not exist."]})

        arm = attrs.get("arm") or None

        exists = SchoolClass.objects.exclude(id=school_class.id).filter(
            name=attrs["name"],
            arm=arm,
            branch=branch,
            section=section,
        ).exists()

        if exists:
            raise serializers.ValidationError(
                {"name": ["A class with this name, arm, branch, and section already exists."]}
            )

        return attrs

    def update(self, instance, validated_data):
        from .models import Branch, Section

        instance.name = validated_data["name"]
        instance.arm = validated_data.get("arm") or None
        instance.branch = Branch.objects.get(id=validated_data["branch"])
        instance.section = Section.objects.get(id=validated_data["section"])
        instance.save()
        return instance

    def to_representation(self, instance):
        return SchoolClassSerializer(instance).data