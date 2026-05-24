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
  getAdminSubjects,
  createAdminSubject,
  updateAdminSubject,
} from "@/services/adminService";

interface SubjectItem {
  id: number;
  name: string;
  code: string;
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
  name: "",
  code: "",
};

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [formData, setFormData] = useState(initialForm);

  async function loadSubjects() {
    try {
      setError("");
      const data = await getAdminSubjects();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    const q = search.trim().toLowerCase();

    return subjects.filter((subject) => {
      return (
        subject.name.toLowerCase().includes(q) ||
        (subject.code || "").toLowerCase().includes(q)
      );
    });
  }, [subjects, search]);

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
    setEditingSubjectId(null);
    setShowEditModal(false);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    resetForm();
  }

  function openEditModal(subject: SubjectItem) {
    setEditingSubjectId(subject.id);
    setFormError("");
    setFormSuccess("");
    setShowCreateModal(false);

    setFormData({
      name: subject.name || "",
      code: subject.code || "",
    });

    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingSubjectId(null);
    resetForm();
  }

  function getErrorMessage(apiError: ApiErrorData | undefined): string {
    if (!apiError) {
      return "Request failed.";
    }

    const firstValue = Object.values(apiError)[0];

    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0]);
    }

    if (typeof firstValue === "string") {
      return firstValue;
    }

    return "Request failed.";
  }

  async function handleCreateSubject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      await createAdminSubject({
        name: formData.name,
        code: formData.code || undefined,
      });

      setFormSuccess("Subject created successfully.");
      await loadSubjects();

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

  async function handleEditSubject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingSubjectId) return;

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      await updateAdminSubject(editingSubjectId, {
        name: formData.name,
        code: formData.code || undefined,
      });

      setFormSuccess("Subject updated successfully.");
      await loadSubjects();

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
        heading="Manage Subjects"
        subtext="Create and update school subjects"
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

          <SectionCard title="Subjects Overview">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Subjects</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {subjects.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Displayed Subjects</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredSubjects.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Subjects With Codes</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {subjects.filter((subject) => (subject.code || "").trim() !== "").length}
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Search Subjects">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-md flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search by subject name or code
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search subjects..."
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
                Add Subject
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Subject Records">
            {loading && (
              <p className="text-sm text-slate-500">Loading subjects...</p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && filteredSubjects.length === 0 && (
              <p className="text-sm text-slate-500">No subjects found.</p>
            )}

            {!loading && !error && filteredSubjects.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Subject Name</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubjects.map((subject) => (
                      <tr key={subject.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {subject.name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {subject.code || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(subject)}
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
                    Create Subject
                  </h2>
                  <p className="text-sm text-slate-500">
                    Add a new subject to the academic structure
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

              <form onSubmit={handleCreateSubject} className="space-y-6 p-6">
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
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="e.g. MTH"
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
                    {submitting ? "Creating..." : "Create Subject"}
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
                    Edit Subject
                  </h2>
                  <p className="text-sm text-slate-500">
                    Update subject details
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

              <form onSubmit={handleEditSubject} className="space-y-6 p-6">
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
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="e.g. MTH"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
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