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
  getManagedClassSubjects,
  createAdminClassSubject,
  updateAdminClassSubject,
  getAdminSubjects,
  getSchoolClasses,
  getSessions,
} from "@/services/adminService";

interface ClassSubjectItem {
  id: number;
  school_class: number;
  class_name: string;
  class_arm?: string | null;
  branch_name?: string | null;
  subject: number;
  subject_name: string;
  subject_code?: string | null;
  session: number;
  session_name: string;
}

interface SubjectItem {
  id: number;
  name: string;
  code?: string | null;
}

interface SchoolClassItem {
  id: number;
  name: string;
  arm?: string | null;
}

interface SessionItem {
  id: number;
  name: string;
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
  school_class: "",
  subject: "",
  session: "",
};

export default function AdminClassSubjectsPage() {
  const [items, setItems] = useState<ClassSubjectItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<SchoolClassItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formData, setFormData] = useState(initialForm);

  async function loadItems() {
    try {
      setError("");
      const data = await getManagedClassSubjects();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load class subjects.");
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    try {
      const [subjectData, classData, sessionData] = await Promise.all([
        getAdminSubjects(),
        getSchoolClasses(),
        getSessions(),
      ]);

      setSubjects(Array.isArray(subjectData) ? subjectData : []);
      setClasses(Array.isArray(classData) ? classData : []);
      setSessions(Array.isArray(sessionData) ? sessionData : []);
    } catch (err) {
      console.error(err);
      setFormError("Failed to load form options.");
    }
  }

  useEffect(() => {
    loadItems();
    loadOptions();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((item) => {
      return (
        item.subject_name.toLowerCase().includes(q) ||
        (item.subject_code || "").toLowerCase().includes(q) ||
        item.class_name.toLowerCase().includes(q) ||
        (item.class_arm || "").toLowerCase().includes(q) ||
        (item.branch_name || "").toLowerCase().includes(q) ||
        item.session_name.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

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
    setEditingId(null);
    setShowEditModal(false);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    resetForm();
  }

  function openEditModal(item: ClassSubjectItem) {
    setEditingId(item.id);
    setFormError("");
    setFormSuccess("");
    setShowCreateModal(false);

    setFormData({
      school_class: String(item.school_class),
      subject: String(item.subject),
      session: String(item.session),
    });

    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingId(null);
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

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      await createAdminClassSubject({
        school_class: Number(formData.school_class),
        subject: Number(formData.subject),
        session: Number(formData.session),
      });

      setFormSuccess("Class subject created successfully.");
      await loadItems();

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

  async function handleEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) return;

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      await updateAdminClassSubject(editingId, {
        school_class: Number(formData.school_class),
        subject: Number(formData.subject),
        session: Number(formData.session),
      });

      setFormSuccess("Class subject updated successfully.");
      await loadItems();

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
        heading="Manage Class Subjects"
        subtext="Connect subjects to classes and sessions"
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

          <SectionCard title="Class Subjects Overview">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Class Subjects</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {items.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Displayed Records</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredItems.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Subjects Represented</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {new Set(items.map((item) => item.subject_name)).size}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Sessions Represented</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {new Set(items.map((item) => item.session_name)).size}
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Search Class Subjects">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-md flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search by subject, code, class, branch, or session
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search class subjects..."
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
                Add Class Subject
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Class Subject Records">
            {loading && (
              <p className="text-sm text-slate-500">Loading class subjects...</p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && filteredItems.length === 0 && (
              <p className="text-sm text-slate-500">No class subjects found.</p>
            )}

            {!loading && !error && filteredItems.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Session</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.subject_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.subject_code || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.class_name} {item.class_arm || ""}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.branch_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.session_name}
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
                    Create Class Subject
                  </h2>
                  <p className="text-sm text-slate-500">
                    Connect a subject to a class and session
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

              <form onSubmit={handleCreate} className="space-y-6 p-6">
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
                      Class
                    </label>
                    <select
                      name="school_class"
                      value={formData.school_class}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select class</option>
                      {classes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}{item.arm ? ` ${item.arm}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Subject
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select subject</option>
                      {subjects.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}{item.code ? ` (${item.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Session
                    </label>
                    <select
                      name="session"
                      value={formData.session}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select session</option>
                      {sessions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
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
                    {submitting ? "Creating..." : "Create Class Subject"}
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
                    Edit Class Subject
                  </h2>
                  <p className="text-sm text-slate-500">
                    Update class subject details
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

              <form onSubmit={handleEdit} className="space-y-6 p-6">
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
                      Class
                    </label>
                    <select
                      name="school_class"
                      value={formData.school_class}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select class</option>
                      {classes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}{item.arm ? ` ${item.arm}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Subject
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select subject</option>
                      {subjects.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}{item.code ? ` (${item.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Session
                    </label>
                    <select
                      name="session"
                      value={formData.session}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select session</option>
                      {sessions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
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