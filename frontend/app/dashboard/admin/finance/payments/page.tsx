"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  Settings,
  KeyRound,
  Search,
  Plus,
  X,
  ArrowLeft,
} from "lucide-react";
import { AxiosError } from "axios";
import {
  getAdminPayments,
  getAdminStudentFees,
  createAdminPayment,
} from "@/services/adminService";

interface PaymentItem {
  id: number;
  student_fee: number;
  student_name: string;
  fee_name: string;
  amount_paid: string;
  payment_date: string;
  reference?: string | null;
}

interface StudentFeeItem {
  id: number;
  student_name: string;
  admission_number?: string;
  fee_name: string;
  fee_amount: string;
  total_paid: string | number;
  balance: string | number;
  term_name: string;
  class_name: string;
  class_arm?: string | null;
}

type ApiErrorData = Record<string, unknown>;

const adminSidebarItems = [
  { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Students", href: "/dashboard/admin/students", icon: GraduationCap },
  { label: "Teachers", href: "/dashboard/admin/teachers", icon: Users },
  { label: "Academics", href: "/dashboard/admin/academics", icon: BookOpen },
  { label: "Finance", href: "/dashboard/admin/finance", icon: CreditCard },
  { label: "Result PINs", href: "/dashboard/admin/pins", icon: KeyRound },
  { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

const initialForm = {
  student_fee: "",
  amount_paid: "",
  payment_date: "",
  reference: "",
};

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFeeItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formData, setFormData] = useState(initialForm);

  async function loadPayments() {
    try {
      setError("");
      const data = await getAdminPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load payment records.");
    } finally {
      setLoading(false);
    }
  }

  async function loadStudentFees() {
    try {
      const data = await getAdminStudentFees();
      setStudentFees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFormError("Failed to load assigned fees.");
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      loadStudentFees();
    }
  }, [showCreateModal]);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();

    return payments.filter((item) => {
      return (
        item.student_name.toLowerCase().includes(q) ||
        item.fee_name.toLowerCase().includes(q) ||
        (item.reference || "").toLowerCase().includes(q) ||
        item.payment_date.toLowerCase().includes(q)
      );
    });
  }, [payments, search]);

  const totalPayments = useMemo(() => {
    return filteredPayments.reduce((sum, item) => sum + toNumber(item.amount_paid), 0);
  }, [filteredPayments]);

  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  function handleInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetForm() {
    setFormData(initialForm);
    setFormError("");
    setFormSuccess("");
  }

  function openCreateModal() {
    resetForm();
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    resetForm();
  }

  function getErrorMessage(apiError: ApiErrorData | undefined): string {
    if (!apiError) return "Request failed.";

    const firstValue = Object.values(apiError)[0];

    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0]);
    }

    if (typeof firstValue === "string") {
      return firstValue;
    }

    return "Request failed.";
  }

  async function handleCreatePayment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      await createAdminPayment({
        student_fee: Number(formData.student_fee),
        amount_paid: formData.amount_paid,
        payment_date: formData.payment_date,
        reference: formData.reference || undefined,
      });

      setFormSuccess("Payment recorded successfully.");
      await loadPayments();

      setTimeout(() => {
        closeCreateModal();
      }, 800);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as AxiosError<ApiErrorData>;
      const apiError = axiosError.response?.data;
      setFormError(getErrorMessage(apiError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin"
        heading="Record Payments"
        subtext="Record student payments against assigned fees"
        sidebarItems={adminSidebarItems}
      >
        <div className="space-y-6">
          <SectionCard title="Navigation">
            <div className="flex items-center justify-between">
              <Link
                href="/dashboard/admin/finance"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
              <ArrowLeft size={16} />
              Back to Finance
            </Link>
            </div>
          </SectionCard>

          <SectionCard title="Payment Overview">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Payment Records</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredPayments.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Recorded Payments</p>
                <h3 className="mt-2 text-2xl font-bold text-green-700">
                  {totalPayments}
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Search Payments">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-md flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search by student, fee name, reference, or payment date
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search payments..."
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Plus size={16} />
                Record Payment
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Payment Records">
            {loading && <p className="text-sm text-slate-500">Loading payments...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && filteredPayments.length === 0 && (
              <p className="text-sm text-slate-500">No payment records found.</p>
            )}

            {!loading && !error && filteredPayments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Fee Name</th>
                      <th className="px-4 py-3">Amount Paid</th>
                      <th className="px-4 py-3">Payment Date</th>
                      <th className="px-4 py-3">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.student_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{item.fee_name}</td>
                        <td className="px-4 py-3 font-medium text-green-700">
                          {item.amount_paid}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{item.payment_date}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.reference || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Record Payment
                  </h2>
                  <p className="text-sm text-slate-500">
                    Select an assigned fee and record payment
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreatePayment} className="space-y-6 p-6">
                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {formSuccess}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Assigned Fee
                    </label>
                    <select
                      name="student_fee"
                      value={formData.student_fee}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select assigned fee</option>
                      {studentFees.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.student_name} - {item.fee_name} - {item.term_name} - Balance: {item.balance}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Amount Paid
                    </label>
                    <input
                      type="number"
                      name="amount_paid"
                      value={formData.amount_paid}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. 15000"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      name="payment_date"
                      value={formData.payment_date}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Reference
                    </label>
                    <input
                      type="text"
                      name="reference"
                      value={formData.reference}
                      onChange={handleInputChange}
                      placeholder="Optional payment reference"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Recording..." : "Record Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}