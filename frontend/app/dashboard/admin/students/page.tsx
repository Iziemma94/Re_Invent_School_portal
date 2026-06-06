"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import {
  getAdminStudents,
  createAdminStudent,
  updateAdminStudent,
  getBranches,
  getSections,
  getSchoolClasses,
  getSessions,
  deactivateAdminStudent,
  activateAdminStudent,
} from "@/services/adminService";
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

interface StudentItem {
  id: number;
  student_name: string;
  full_name?: string;
  username: string;
  phone_number?: string;
  profile_picture?: string | null;
  is_active?: boolean;
  admission_number: string;
  date_of_birth?: string | null;
  gender?: string | null;
  branch?: number | null;
  branch_name?: string | null;
  section?: number | null;
  section_name?: string | null;
  school_class?: number | null;
  class_name?: string | null;
  class_arm?: string | null;
  session?: number | null;
  session_name?: string | null;
}

interface OptionItem {
  id: number;
  name: string;
  arm?: string | null;
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
  full_name: "",
  username: "",
  password: "",
  phone_number: "",
  admission_number: "",
  date_of_birth: "",
  gender: "",
  branch: "",
  section: "",
  school_class: "",
  session: "",
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [branches, setBranches] = useState<OptionItem[]>([]);
  const [sections, setSections] = useState<OptionItem[]>([]);
  const [classes, setClasses] = useState<OptionItem[]>([]);
  const [sessions, setSessions] = useState<OptionItem[]>([]);

  const [formData, setFormData] = useState(initialForm);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  async function loadStudents() {
    try {
      setError("");
      const data = await getAdminStudents();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load students.");
    } finally {
      setLoading(false);
    }
  }

  async function loadFormOptions() {
    try {
      setFormError("");

      const [branchData, sectionData, classData, sessionData] =
        await Promise.all([
          getBranches(),
          getSections(),
          getSchoolClasses(),
          getSessions(),
        ]);

      setBranches(Array.isArray(branchData) ? branchData : []);
      setSections(Array.isArray(sectionData) ? sectionData : []);
      setClasses(Array.isArray(classData) ? classData : []);
      setSessions(Array.isArray(sessionData) ? sessionData : []);
    } catch (err) {
      console.error(err);
      setFormError("Failed to load form options.");
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (showCreateModal || showEditModal) {
      loadFormOptions();
    }
  }, [showCreateModal, showEditModal]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();

    return students.filter((student) => {
      return (
        student.student_name.toLowerCase().includes(q) ||
        student.username.toLowerCase().includes(q) ||
        (student.admission_number || "").toLowerCase().includes(q) ||
        (student.branch_name || "").toLowerCase().includes(q) ||
        (student.section_name || "").toLowerCase().includes(q) ||
        (student.class_name || "").toLowerCase().includes(q) ||
        (student.session_name || "").toLowerCase().includes(q)
      );
    });
  }, [students, search]);

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

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setProfilePictureFile(file);
  }

  function resetForm() {
    setFormData(initialForm);
    setProfilePictureFile(null);
    setFormError("");
    setFormSuccess("");
  }

  function openCreateModal() {
    resetForm();
    setEditingStudentId(null);
    setShowEditModal(false);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    resetForm();
  }

  function openEditModal(student: StudentItem) {
    setFormError("");
    setFormSuccess("");
    setProfilePictureFile(null);
    setEditingStudentId(student.id);
    setShowCreateModal(false);

    setFormData({
      full_name: student.full_name || student.student_name || "",
      username: student.username || "",
      password: "",
      phone_number: student.phone_number || "",
      admission_number: student.admission_number || "",
      date_of_birth: student.date_of_birth
        ? String(student.date_of_birth).slice(0, 10)
        : "",
      gender: student.gender || "",
      branch: student.branch ? String(student.branch) : "",
      section: student.section ? String(student.section) : "",
      school_class: student.school_class ? String(student.school_class) : "",
      session: student.session ? String(student.session) : "",
    });

    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingStudentId(null);
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

  async function handleToggleStudentStatus(student: StudentItem) {
    const action = student.is_active ? "deactivate" : "activate";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${student.student_name}?`
    );

    if (!confirmed) return;

    try {
      if (student.is_active) {
        await deactivateAdminStudent(student.id);
      } else {
        await activateAdminStudent(student.id);
      }

      await loadStudents();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} student.`);
    }
  }

  async function handleCreateStudent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const payload = new FormData();
      payload.append("full_name", formData.full_name);
      payload.append("username", formData.username);
      payload.append("password", formData.password);
      payload.append("admission_number", formData.admission_number);
      payload.append("branch", String(Number(formData.branch)));
      payload.append("section", String(Number(formData.section)));
      payload.append("school_class", String(Number(formData.school_class)));
      payload.append("session", String(Number(formData.session)));

      if (formData.phone_number) payload.append("phone_number", formData.phone_number);
      if (formData.date_of_birth) payload.append("date_of_birth", formData.date_of_birth);
      if (formData.gender) payload.append("gender", formData.gender);
      if (profilePictureFile) payload.append("profile_picture", profilePictureFile);

      await createAdminStudent(payload);
      setFormSuccess("Student created successfully.");
      await loadStudents();

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

  async function handleEditStudent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingStudentId) return;

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const payload = new FormData();
      payload.append("full_name", formData.full_name);
      payload.append("username", formData.username);
      payload.append("admission_number", formData.admission_number);
      payload.append("branch", String(Number(formData.branch)));
      payload.append("section", String(Number(formData.section)));
      payload.append("school_class", String(Number(formData.school_class)));
      payload.append("session", String(Number(formData.session)));

      if (formData.phone_number) payload.append("phone_number", formData.phone_number);
      if (formData.date_of_birth) payload.append("date_of_birth", formData.date_of_birth);
      if (formData.gender) payload.append("gender", formData.gender);
      if (profilePictureFile) payload.append("profile_picture", profilePictureFile);

      await updateAdminStudent(editingStudentId, payload);
      setFormSuccess("Student updated successfully.");
      await loadStudents();

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
        heading="Manage Students"
        subtext="View and manage all student records"
        sidebarItems={adminSidebarItems}
      >
        <div className="space-y-6">
          <SectionCard title="Navigation">
            <div className="flex items-center justify-between gap-4">
              <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back to Dashboard 
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Students Overview">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Students</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {students.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Displayed Students</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredStudents.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Branches Represented</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {
                    new Set(
                      students
                        .map((student) => student.branch_name)
                        .filter(
                          (value): value is string =>
                            Boolean(value && value.trim() !== "")
                        )
                    ).size
                  }
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Classes Represented</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {
                    new Set(
                      students
                        .map((student) =>
                          student.class_name
                            ? `${student.class_name}${student.class_arm ? ` ${student.class_arm}` : ""}`
                            : ""
                        )
                        .filter((value) => value.trim() !== "")
                    ).size
                  }
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Search Students">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-md flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search by name, username, admission number, branch, section,
                  class, or session
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search students..."
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
                Add Student
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Student Records">
            {loading && (
              <p className="text-sm text-slate-500">Loading students...</p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && filteredStudents.length === 0 && (
              <p className="text-sm text-slate-500">No students found.</p>
            )}

            {!loading && !error && filteredStudents.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Admission No</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Section</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Session</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {student.student_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {student.username}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {student.admission_number || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {student.branch_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {student.section_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {student.class_name
                            ? `${student.class_name}${student.class_arm ? ` ${student.class_arm}` : ""}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {student.session_name || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              student.is_active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {student.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(student)}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStudentStatus(student)}
                              className={`rounded-lg px-3 py-2 text-xs font-medium text-white ${
                                student.is_active
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              {student.is_active ? "Deactivate" : "Activate"}
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
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Create Student
                  </h2>
                  <p className="text-sm text-slate-500">
                    Add a new student and enroll them in a class
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

              <form onSubmit={handleCreateStudent} className="space-y-6 p-6">
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
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Profile Picture
                    </label>
                    <input
                      type="file"
                      name="profile_picture"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm focus:border-slate-400"
                    />
                    {profilePictureFile && (
                      <p className="mt-2 text-xs text-slate-500">
                        Selected: {profilePictureFile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Admission Number
                    </label>
                    <input
                      type="text"
                      name="admission_number"
                      value={formData.admission_number}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Branch
                    </label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Section
                    </label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select section</option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
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
                      {classes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {item.arm ? ` ${item.arm}` : ""}
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
                    {submitting ? "Creating..." : "Create Student"}
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
                    Edit Student
                  </h2>
                  <p className="text-sm text-slate-500">
                    Update student profile and enrollment details
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

              <form onSubmit={handleEditStudent} className="space-y-6 p-6">
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
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Profile Picture
                    </label>
                    <input
                      type="file"
                      name="profile_picture"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm focus:border-slate-400"
                    />
                    {profilePictureFile ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Selected: {profilePictureFile.name}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        Leave empty to keep the current profile picture.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Admission Number
                    </label>
                    <input
                      type="text"
                      name="admission_number"
                      value={formData.admission_number}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Branch
                    </label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Section
                    </label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Select section</option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
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
                      {classes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {item.arm ? ` ${item.arm}` : ""}
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