from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.accounts.permissions import IsAdminUserRole
from .models import Setting, Branch, Section, SchoolClass, AcademicSession
from .serializers import (
    SettingSerializer,
    SettingUpdateSerializer,
    BranchSerializer,
    SectionSerializer,
    AcademicSessionSerializer,
    SchoolClassSerializer,
    AdminCreateSchoolClassSerializer,
    AdminUpdateSchoolClassSerializer,
)


DEFAULT_SETTINGS = [
    {"category": "school", "key": "school_name", "value": "Re-Invent Schools"},
    {"category": "school", "key": "school_email", "value": "info@reinventschools.com"},
    {"category": "school", "key": "school_phone", "value": "08103355019"},
    {"category": "school", "key": "school_address", "value": "Lagos, Nigeria"},
    {"category": "school", "key": "school_website", "value": "www.re-inventschools.com"},
    {"category": "school", "key": "school_motto", "value": "Learning for Excellence"},

    {"category": "academic", "key": "current_session", "value": ""},
    {"category": "academic", "key": "current_term", "value": ""},
    {"category": "academic", "key": "portal_status", "value": "open"},
    {"category": "academic", "key": "result_checking_enabled", "value": "true"},
    {"category": "academic", "key": "notes_download_enabled", "value": "true"},

    {"category": "report_card", "key": "show_attendance", "value": "true"},
    {"category": "report_card", "key": "show_position", "value": "true"},
    {"category": "report_card", "key": "show_primary_traits", "value": "true"},
    {"category": "report_card", "key": "report_footer_note", "value": "This report card is not valid without the official school stamp and authorized signature."},
    {"category": "report_card", "key": "max_pin_usage", "value": "3"},

    {"category": "finance", "key": "school_currency", "value": "NGN"},
    {"category": "finance", "key": "allow_part_payment", "value": "true"},
    {"category": "finance", "key": "show_fee_balance_to_students", "value": "true"},
]


def ensure_default_settings():
    for item in DEFAULT_SETTINGS:
        Setting.objects.get_or_create(
            key=item["key"],
            defaults={
                "category": item["category"],
                "value": item["value"],
            },
        )

class SettingListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        ensure_default_settings()
        settings_qs = Setting.objects.all().order_by("category", "key")
        serializer = SettingSerializer(settings_qs, many=True)
        return Response(serializer.data)


class SettingUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def put(self, request, setting_id):
        setting = get_object_or_404(Setting, id=setting_id)
        serializer = SettingUpdateSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            updated_setting = serializer.save()
            return Response(
                {
                    "message": "Setting updated successfully.",
                    "setting": SettingSerializer(updated_setting).data,
                }
            )
        return Response(serializer.errors, status=400)


class SettingBulkUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def put(self, request):
        payload = request.data.get("settings", [])

        if not isinstance(payload, list):
            return Response({"detail": "settings must be a list."}, status=400)

        updated_items = []

        for item in payload:
            setting_id = item.get("id")
            value = item.get("value")

            if not setting_id:
                continue

            setting = Setting.objects.filter(id=setting_id).first()
            if not setting:
                continue

            setting.value = value if value is not None else ""
            setting.save()
            updated_items.append(setting)

        serializer = SettingSerializer(updated_items, many=True)
        return Response(
            {
                "message": "Settings updated successfully.",
                "settings": serializer.data,
            }
        )


class BranchListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        branches = Branch.objects.all().order_by("name")
        serializer = BranchSerializer(branches, many=True)
        return Response(serializer.data)


class SectionListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        sections = Section.objects.all().order_by("name")
        serializer = SectionSerializer(sections, many=True)
        return Response(serializer.data)


class AcademicSessionListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        sessions = AcademicSession.objects.all().order_by("-start_date")
        serializer = AcademicSessionSerializer(sessions, many=True)
        return Response(serializer.data)


class SchoolClassListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        classes = SchoolClass.objects.select_related("branch", "section").order_by(
            "section__name", "name", "arm"
        )
        serializer = SchoolClassSerializer(classes, many=True)
        return Response(serializer.data)


class AdminSchoolClassCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def post(self, request):
        serializer = AdminCreateSchoolClassSerializer(data=request.data)
        if serializer.is_valid():
            school_class = serializer.save()
            return Response(
                {
                    "message": "Class created successfully.",
                    "school_class": SchoolClassSerializer(school_class).data,
                },
                status=201,
            )
        return Response(serializer.errors, status=400)


class AdminSchoolClassUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def put(self, request, class_id):
        school_class = SchoolClass.objects.filter(id=class_id).first()
        if not school_class:
            return Response({"detail": "Class not found."}, status=404)

        serializer = AdminUpdateSchoolClassSerializer(
            school_class,
            data=request.data,
            context={"school_class": school_class},
        )

        if serializer.is_valid():
            updated_class = serializer.save()
            return Response(
                {
                    "message": "Class updated successfully.",
                    "school_class": SchoolClassSerializer(updated_class).data,
                },
                status=200,
            )
        return Response(serializer.errors, status=400)