"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  ArrowLeft,
  Plus,
  X,
} from "lucide-react";
import {
  getAdminTeachers,
  getSchoolClasses,
  getAcademicSessions,
  getAdminClassTeacherAssignments,
  createAdminClassTeacherAssignment,
  updateAdminClassTeacherAssignment,
  deleteAdminClassTeacherAssignment,
} from "@/services/adminService";

interface TeacherItem {
  id: number;
  teacher_name: string;
  full_name?: string;
  username: string;
  staff_id: string;
  branch_names?: string[];
  section_names?: string[];
  is_active?: boolean;
}

interface SchoolClassItem {
  id: number;
  name: string;
  arm?: string | null;
  branch_name?: string;
  section_name?: string;
}

interface SessionItem {
  id: number;
  name: string;
}

interface ClassTeacherAssignmentItem {
  id: number;
  teacher: number;
  teacher_name: string;
  school_class: number;
  class_name: string;
  class_arm?: string | null;
  branch_name?: string | null;
  section_name?: string | null;
  session: number;
  session_name: string;
}

interface FormState {
  teacher: string;
  school_class: string;
  session: string;
}

const adminSidebarItems = [
  { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Students", href: "/dashboard/admin/students", icon: GraduationCap },
  { label: "Teachers", href: "/dashboard/admin/teachers", icon: Users },
  { label: "Academics", href: "/dashboard/admin/academics", icon: BookOpen },
  { label: "Finance", href: "/dashboard/admin/finance", icon: CreditCard },
  { label: "Result PINs", href: "/dashboard/admin/pins", icon: KeyRound },
  { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

const initialForm: FormState = {
  teacher: "",
  school_class: "",
  session: "",
};

export default function AdminClassTeacherAssignmentsPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classes, setClasses] = useState<SchoolClassItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [assignments, setAssignments] = useState<ClassTeacherAssignmentItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<ClassTeacherAssignmentItem | null>(null);

  const [formData, setFormData] = useState<FormState>(initialForm);

  async function loadPageData() {
    try {
      setError("");

      const [teachersData, classesData, sessionsData, assignmentsData] =
        await Promise.all([
          getAdminTeachers(),
          getSchoolClasses(),
          getAcademicSessions(),
          getAdminClassTeacherAssignments(),
        ]);

      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load class teacher assignments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
  }, []);

  const activeTeachers = useMemo(() => {
    return teachers.filter((teacher) => teacher.is_active !== false);
  }, [teachers]);

  const classOptions = useMemo(() => {
    return classes.map((item) => ({
      value: String(item.id),
      label: `${item.name}${item.arm ? ` ${item.arm}` : ""}${item.section_name ? ` - ${item.section_name}` : ""}${item.branch_name ? ` - ${item.branch_name}` : ""}`,
    }));
  }, [classes]);

  function resetForm() {
    setFormData(initialForm);
    setEditingAssignment(null);
    setError("");
    setSuccess("");
  }

  function openCreateModal() {
    resetForm();
    setShowEditModal(false);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    resetForm();
  }

  function openEditModal(item: ClassTeacherAssignmentItem) {
    setEditingAssignment(item);
    setFormData({
      teacher: String(item.teacher),
      school_class: String(item.school_class),
      session: String(item.session),
    });
    setShowCreateModal(false);
    setShowEditModal(true);
    setError("");
    setSuccess("");
  }

  function closeEditModal() {
    setShowEditModal(false);
    resetForm();
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await createAdminClassTeacherAssignment({
        teacher: Number(formData.teacher),
        school_class: Number(formData.school_class),
        session: Number(formData.session),
      });

      setSuccess("Class teacher assignment created successfully.");
      await loadPageData();

      setTimeout(() => {
        closeCreateModal();
      }, 700);
    } catch (err) {
      console.error(err);
      setError("Failed to create class teacher assignment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingAssignment) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await updateAdminClassTeacherAssignment(editingAssignment.id, {
        teacher: Number(formData.teacher),
        school_class: Number(formData.school_class),
        session: Number(formData.session),
      });

      setSuccess("Class teacher assignment updated successfully.");
      await loadPageData();

      setTimeout(() => {
        closeEditModal();
      }, 700);
    } catch (err) {
      console.error(err);
      setError("Failed to update class teacher assignment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: ClassTeacherAssignmentItem) {
    const confirmed = window.confirm(
      `Delete class teacher assignment for ${item.class_name}${item.class_arm ? ` ${item.class_arm}` : ""} (${item.session_name})?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteAdminClassTeacherAssignment(item.id);
      setSuccess("Class teacher assignment deleted successfully.");
      await loadPageData();
    } catch (err) {
      console.error(err);
      setError("Failed to delete class teacher assignment.");
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin"
        heading="Class Teacher Assignments"
        subtext="Assign teachers as class teachers for classes and sessions"
        sidebarItems={adminSidebarItems}
      >
        <div className="space-y-6">
          <SectionCard title="Navigation">
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/dashboard/admin/academics"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back to Academics
              </Link>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Plus size={16} />
                Add Class Teacher Assignment
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Assignments Overview">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Assignments</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {assignments.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Available Teachers</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {activeTeachers.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Available Classes</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {classes.length}
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Class Teacher Assignment Records">
            {loading && (
              <p className="text-sm text-slate-500">Loading assignments...</p>
            )}

            {!loading && error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {!loading && !error && success && (
              <p className="text-sm text-green-600">{success}</p>
            )}

            {!loading && !error && assignments.length === 0 && (
              <p className="text-sm text-slate-500">
                No class teacher assignments found.
              </p>
            )}

            {!loading && !error && assignments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Teacher</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Section</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Session</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.teacher_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.class_name} {item.class_arm || ""}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.section_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.branch_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.session_name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
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
                    Add Class Teacher Assignment
                  </h2>
                  <p className="text-sm text-slate-500">
                    Assign a teacher to a class for a session
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
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-1">
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
                      {activeTeachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {(teacher.full_name || teacher.teacher_name)} ({teacher.staff_id})
                        </option>
                      ))}
                    </select>
                  </div>

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
                      {classOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
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
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.name}
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

        {showEditModal && editingAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Edit Class Teacher Assignment
                  </h2>
                  <p className="text-sm text-slate-500">
                    Update teacher, class, or session
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
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-1">
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
                      {activeTeachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {(teacher.full_name || teacher.teacher_name)} ({teacher.staff_id})
                        </option>
                      ))}
                    </select>
                  </div>

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
                      {classOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
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
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.name}
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