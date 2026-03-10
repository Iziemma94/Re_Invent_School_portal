# Register your models here.

from django.contrib import admin
from .models import FeeStructure, StudentFee, StudentPayment


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ("name", "school_class", "term", "amount", "branch", "section")
    list_filter = ("branch", "section", "school_class", "term")
    search_fields = ("name", "school_class__name")


@admin.register(StudentFee)
class StudentFeeAdmin(admin.ModelAdmin):
    list_display = ("student", "fee_structure", "total_paid", "balance", "assigned_at")
    list_filter = ("fee_structure__term", "fee_structure__school_class")
    search_fields = ("student__user__full_name",)


@admin.register(StudentPayment)
class StudentPaymentAdmin(admin.ModelAdmin):
    list_display = ("student_fee", "amount_paid", "payment_date", "reference")
    list_filter = ("payment_date",)
    search_fields = ("student_fee__student__user__full_name", "reference")