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
  getAdminAssignments,
  createAdminAssignment,
  updateAdminAssignment,
  getAssignmentTeachers,
  getAdminClassSubjects,
} from "@/services/adminService";

interface AssignmentItem {
  id: number;
  teacher: number;
  teacher_name: string;
  class_subject: number;
  subject_name: string;
  subject_code: string;
  class_name: string;
  class_arm: string;
  branch_name?: string | null;
  session_name?: string | null;
}

interface TeacherItem {
  id: number;
  teacher_name: string;
  username: string;
  staff_id: string;
}

interface ClassSubjectItem {
  id: number;
  subject_name: string;
  subject_code: string;
  class_name: string;
  class_arm?: string | null;
  branch_name?: string | null;
  session_name?: string | null;
  display_name: string;
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
  teacher: "",
  class_subject: "",
};

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubjectItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formData, setFormData] = useState(initialForm);

  async function loadAssignments() {
    try {
      setError("");
      const data = await getAdminAssignments();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    try {
      const [teacherData, classSubjectData] = await Promise.all([
        getAssignmentTeachers(),
        getAdminClassSubjects(),
      ]);

      setTeachers(Array.isArray(teacherData) ? teacherData : []);
      setClassSubjects(Array.isArray(classSubjectData) ? classSubjectData : []);
    } catch (err) {
      console.error(err);
      setFormError("Failed to load form options.");
    }
  }

  useEffect(() => {
    loadAssignments();
    loadOptions();
  }, []);

  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase();

    return assignments.filter((item) => {
      return (
        item.teacher_name.toLowerCase().includes(q) ||
        item.subject_name.toLowerCase().includes(q) ||
        (item.subject_code || "").toLowerCase().includes(q) ||
        item.class_name.toLowerCase().includes(q) ||
        (item.class_arm || "").toLowerCase().includes(q) ||
        (item.branch_name || "").toLowerCase().includes(q) ||
        (item.session_name || "").toLowerCase().includes(q)
      );
    });
  }, [assignments, search]);

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
    setEditingAssignmentId(null);
    setShowEditModal(false);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    resetForm();
  }

  function openEditModal(item: AssignmentItem) {
    setEditingAssignmentId(item.id);
    setFormError("");
    setFormSuccess("");
    setShowCreateModal(false);

    setFormData({
      teacher: String(item.teacher),
      class_subject: String(item.class_subject),
    });

    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingAssignmentId(null);
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

  async function handleCreateAssignment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      await createAdminAssignment({
        teacher: Number(formData.teacher),
        class_subject: Number(formData.class_subject),
      });

      setFormSuccess("Assignment created successfully.");
      await loadAssignments();

      setTimeout(() => {
        closeCreateModal();
      }, 800);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as AxiosError<ApiErrorData>;
      setFormError(getErrorMessage(axiosError.response?.data));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditAssignment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingAssignmentId) return;

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      await updateAdminAssignment(editingAssignmentId, {
        teacher: Number(formData.teacher),
        class_subject: Number(formData.class_subject),
      });

      setFormSuccess("Assignment updated successfully.");
      await loadAssignments();

      setTimeout(() => {
        closeEditModal();
      }, 800);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as AxiosError<ApiErrorData>;
      setFormError(getErrorMessage(axiosError.response?.data));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin"
        heading="Teacher Assignments"
        subtext="Assign teachers to class subjects"
        sidebarItems={adminSidebarItems}
      >
        <div className="space-y-6">
          <SectionCard title="Navigation">
            <div className="flex items-center justify-between">
              <Link
                href="/dashboard/admin/academics"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back to Academics
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Assignments Overview">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Assignments</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {assignments.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Displayed Assignments</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredAssignments.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Teachers Assigned</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {new Set(assignments.map((item) => item.teacher_name)).size}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Subjects Covered</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {new Set(assignments.map((item) => item.subject_name)).size}
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Search Assignments">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-md flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search by teacher, subject, class, branch, or session
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search assignments..."
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
                Add Assignment
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Assignment Records">
            {loading && (
              <p className="text-sm text-slate-500">Loading assignments...</p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && filteredAssignments.length === 0 && (
              <p className="text-sm text-slate-500">No assignments found.</p>
            )}

            {!loading && !error && filteredAssignments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Teacher</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Session</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.teacher_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.subject_name} ({item.subject_code || "-"})
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.class_name} {item.class_arm || ""}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.branch_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.session_name || "-"}
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
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Create Assignment
                  </h2>
                  <p className="text-sm text-slate-500">
                    Assign a teacher to a class subject
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

              <form onSubmit={handleCreateAssignment} className="space-y-6 p-6">
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

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Teacher
                    </label>
                    <select
                      name="teacher"
                      value={formData.teacher}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.teacher_name} ({teacher.staff_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Class Subject
                    </label>
                    <select
                      name="class_subject"
                      value={formData.class_subject}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select class subject</option>
                      {classSubjects.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.display_name}
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
                    {submitting ? "Creating..." : "Create Assignment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Edit Assignment
                  </h2>
                  <p className="text-sm text-slate-500">
                    Update teacher assignment details
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

              <form onSubmit={handleEditAssignment} className="space-y-6 p-6">
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

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Teacher
                    </label>
                    <select
                      name="teacher"
                      value={formData.teacher}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.teacher_name} ({teacher.staff_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Class Subject
                    </label>
                    <select
                      name="class_subject"
                      value={formData.class_subject}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select class subject</option>
                      {classSubjects.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.display_name}
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