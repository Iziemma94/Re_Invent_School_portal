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
  getAdminStudents,
  getAdminFeeStructures,
  getAdminStudentFees,
  assignAdminStudentFee,
  updateAdminStudentFee,
} from "@/services/adminService";

interface StudentItem {
  id: number;
  student_name: string;
  admission_number?: string;
}

interface FeeStructureItem {
  id: number;
  name: string;
  amount: string;
  class_name: string;
  class_arm?: string | null;
  term_name: string;
  branch_name: string;
  section_name: string;
}

interface StudentFeeItem {
  id: number;
  student: number;
  student_name: string;
  admission_number?: string;
  fee_structure: number;
  fee_name: string;
  fee_amount: string;
  term_name: string;
  class_name: string;
  class_arm?: string | null;
  branch_name: string;
  section_name: string;
  total_paid: string | number;
  balance: string | number;
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
  student: "",
  fee_structure: "",
};

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

export default function AdminStudentFeesPage() {
  const [studentFees, setStudentFees] = useState<StudentFeeItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudentFeeId, setEditingStudentFeeId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formData, setFormData] = useState(initialForm);

  async function loadStudentFees() {
    try {
      setError("");
      const data = await getAdminStudentFees();
      setStudentFees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load assigned student fees.");
    } finally {
      setLoading(false);
    }
  }

  async function loadFormOptions() {
    try {
      setFormError("");
      const [studentsData, feeStructuresData] = await Promise.all([
        getAdminStudents(),
        getAdminFeeStructures(),
      ]);

      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setFeeStructures(Array.isArray(feeStructuresData) ? feeStructuresData : []);
    } catch (err) {
      console.error(err);
      setFormError("Failed to load form options.");
    }
  }

  useEffect(() => {
    loadStudentFees();
  }, []);

  useEffect(() => {
    if (showCreateModal || showEditModal) {
      loadFormOptions();
    }
  }, [showCreateModal, showEditModal]);

  const filteredStudentFees = useMemo(() => {
    const q = search.trim().toLowerCase();

    return studentFees.filter((item) => {
      return (
        item.student_name.toLowerCase().includes(q) ||
        (item.admission_number || "").toLowerCase().includes(q) ||
        item.fee_name.toLowerCase().includes(q) ||
        item.class_name.toLowerCase().includes(q) ||
        (item.class_arm || "").toLowerCase().includes(q) ||
        item.term_name.toLowerCase().includes(q) ||
        item.branch_name.toLowerCase().includes(q) ||
        item.section_name.toLowerCase().includes(q)
      );
    });
  }, [studentFees, search]);

  const totalAssigned = useMemo(() => {
    return filteredStudentFees.reduce((sum, item) => sum + toNumber(item.fee_amount), 0);
  }, [filteredStudentFees]);

  const totalPaid = useMemo(() => {
    return filteredStudentFees.reduce((sum, item) => sum + toNumber(item.total_paid), 0);
  }, [filteredStudentFees]);

  const totalBalance = useMemo(() => {
    return filteredStudentFees.reduce((sum, item) => sum + toNumber(item.balance), 0);
  }, [filteredStudentFees]);

  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  function handleInputChange(
    e: ChangeEvent<HTMLSelectElement | HTMLInputElement>
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
    setEditingStudentFeeId(null);
    setShowEditModal(false);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    resetForm();
  }

  function openEditModal(item: StudentFeeItem) {
    setFormError("");
    setFormSuccess("");
    setEditingStudentFeeId(item.id);
    setShowCreateModal(false);

    setFormData({
      student: String(item.student),
      fee_structure: String(item.fee_structure),
    });

    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingStudentFeeId(null);
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

  async function handleCreateStudentFee(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      await assignAdminStudentFee({
        student: Number(formData.student),
        fee_structure: Number(formData.fee_structure),
      });

      setFormSuccess("Fee assigned to student successfully.");
      await loadStudentFees();

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

  async function handleEditStudentFee(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingStudentFeeId) return;

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      await updateAdminStudentFee(editingStudentFeeId, {
        student: Number(formData.student),
        fee_structure: Number(formData.fee_structure),
      });

      setFormSuccess("Assigned fee updated successfully.");
      await loadStudentFees();

      setTimeout(() => {
        closeEditModal();
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
        heading="Assign Fees to Students"
        subtext="Assign fee structures to individual students"
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

          <SectionCard title="Assigned Fee Overview">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Assigned Records</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredStudentFees.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Assigned</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {totalAssigned}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Paid</p>
                <h3 className="mt-2 text-2xl font-bold text-green-700">
                  {totalPaid}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Outstanding Balance</p>
                <h3 className="mt-2 text-2xl font-bold text-red-700">
                  {totalBalance}
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Search Assigned Fees">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-md flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search by student, admission number, fee, class, term, branch, or section
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search assigned fees..."
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
                Assign Fee
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Assigned Fee Records">
            {loading && (
              <p className="text-sm text-slate-500">Loading assigned fees...</p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && filteredStudentFees.length === 0 && (
              <p className="text-sm text-slate-500">No assigned fees found.</p>
            )}

            {!loading && !error && filteredStudentFees.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Admission No</th>
                      <th className="px-4 py-3">Fee Name</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Term</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Balance</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentFees.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.student_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.admission_number || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.fee_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.fee_amount}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.class_name}
                          {item.class_arm ? ` ${item.class_arm}` : ""}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.term_name}
                        </td>
                        <td className="px-4 py-3 font-medium text-green-700">
                          {item.total_paid}
                        </td>
                        <td className="px-4 py-3 font-medium text-red-700">
                          {item.balance}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
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
                    Assign Fee to Student
                  </h2>
                  <p className="text-sm text-slate-500">
                    Select a student and a fee structure
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

              <form onSubmit={handleCreateStudentFee} className="space-y-6 p-6">
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

                <div className="grid gap-4 md:grid-cols-1">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Student
                    </label>
                    <select
                      name="student"
                      value={formData.student}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.student_name}
                          {student.admission_number ? ` (${student.admission_number})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Fee Structure
                    </label>
                    <select
                      name="fee_structure"
                      value={formData.fee_structure}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select fee structure</option>
                      {feeStructures.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} - {item.class_name}
                          {item.class_arm ? ` ${item.class_arm}` : ""} - {item.term_name} - {item.amount}
                        </option>
                      ))}
                    </select>
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
                    {submitting ? "Assigning..." : "Assign Fee"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Edit Assigned Fee
                  </h2>
                  <p className="text-sm text-slate-500">
                    Update the student or fee structure assignment
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditStudentFee} className="space-y-6 p-6">
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

                <div className="grid gap-4 md:grid-cols-1">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Student
                    </label>
                    <select
                      name="student"
                      value={formData.student}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.student_name}
                          {student.admission_number ? ` (${student.admission_number})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Fee Structure
                    </label>
                    <select
                      name="fee_structure"
                      value={formData.fee_structure}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select fee structure</option>
                      {feeStructures.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} - {item.class_name}
                          {item.class_arm ? ` ${item.class_arm}` : ""} - {item.term_name} - {item.amount}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Saving..." : "Save Changes"}
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