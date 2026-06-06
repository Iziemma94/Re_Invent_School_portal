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
  getAdminTeachers,
  createAdminTeacher,
  updateAdminTeacher,
  getBranches,
  getSections,
  deactivateAdminTeacher,
  activateAdminTeacher,
  getAcademicSessions,
  getSchoolClasses,
  getAdminClassTeacherAssignments,
  createAdminClassTeacherAssignment,
  updateAdminClassTeacherAssignment,
} from "@/services/adminService";

interface TeacherItem {
  id: number;
  teacher_name: string;
  full_name?: string;
  username: string;
  phone_number?: string;
  profile_picture?: string | null;
  is_active?: boolean;
  staff_id: string;
  branches?: number[];
  branch_names?: string[];
  sections?: number[];
  section_names?: string[];
}

interface OptionItem {
  id: number;
  name: string;
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
  staff_id: "",
  branches: [] as string[],
  sections: [] as string[],
  assign_as_class_teacher: false,
  school_class: "",
  session: "",
};

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [branches, setBranches] = useState<OptionItem[]>([]);
  const [sections, setSections] = useState<OptionItem[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClassItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [classTeacherAssignments, setClassTeacherAssignments] = useState<ClassTeacherAssignmentItem[]>([]);

  const [formData, setFormData] = useState(initialForm);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  async function loadTeachers() {
    try {
      setError("");
      const data = await getAdminTeachers();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  }

  async function loadFormOptions() {
    try {
      setFormError("");
      const [branchData, sectionData, classesData, sessionsData, classTeacherData] =
        await Promise.all([
          getBranches(),
          getSections(),
          getSchoolClasses(),
          getAcademicSessions(),
          getAdminClassTeacherAssignments(),
        ]);

      setBranches(Array.isArray(branchData) ? branchData : []);
      setSections(Array.isArray(sectionData) ? sectionData : []);
      setSchoolClasses(Array.isArray(classesData) ? classesData : []);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setClassTeacherAssignments(Array.isArray(classTeacherData) ? classTeacherData : []);
    } catch (err) {
      console.error(err);
      setFormError("Failed to load form options.");
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (showCreateModal || showEditModal) {
      loadFormOptions();
    }
  }, [showCreateModal, showEditModal]);

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return teachers.filter((teacher) => {
      return (
        teacher.teacher_name.toLowerCase().includes(q) ||
        teacher.username.toLowerCase().includes(q) ||
        (teacher.staff_id || "").toLowerCase().includes(q) ||
        (teacher.branch_names || []).join(" ").toLowerCase().includes(q) ||
        (teacher.section_names || []).join(" ").toLowerCase().includes(q)
      );
    });
  }, [teachers, search]);

  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  function handleInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setProfilePictureFile(file);
  }

  function handleMultiSelectChange(
    field: "branches" | "sections",
    value: string,
    checked: boolean
  ) {
    setFormData((prev) => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter((item) => item !== value),
    }));
  }

  function resetForm() {
    setFormData(initialForm);
    setProfilePictureFile(null);
    setFormError("");
    setFormSuccess("");
  }

  function openCreateModal() {
    resetForm();
    setEditingTeacherId(null);
    setShowEditModal(false);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    resetForm();
  }

  function openEditModal(teacher: TeacherItem) {
    setFormError("");
    setFormSuccess("");
    setProfilePictureFile(null);
    setEditingTeacherId(teacher.id);
    setShowCreateModal(false);

    const existingAssignment = classTeacherAssignments.find(
      (item) => item.teacher === teacher.id
    );

    setFormData({
      full_name: teacher.full_name || teacher.teacher_name || "",
      username: teacher.username || "",
      password: "",
      phone_number: teacher.phone_number || "",
      staff_id: teacher.staff_id || "",
      branches: (teacher.branches || []).map(String),
      sections: (teacher.sections || []).map(String),
      assign_as_class_teacher: Boolean(existingAssignment),
      school_class: existingAssignment ? String(existingAssignment.school_class) : "",
      session: existingAssignment ? String(existingAssignment.session) : "",
    });

    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingTeacherId(null);
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

  async function handleToggleTeacherStatus(teacher: TeacherItem) {
    const action = teacher.is_active ? "deactivate" : "activate";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${teacher.teacher_name}?`
    );

    if (!confirmed) return;

    try {
      if (teacher.is_active) {
        await deactivateAdminTeacher(teacher.id);
      } else {
        await activateAdminTeacher(teacher.id);
      }

      await loadTeachers();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} teacher.`);
    }
  }

  async function saveClassTeacherAssignment(teacherId: number) {
    if (!formData.assign_as_class_teacher) return;

    if (!formData.school_class || !formData.session) {
      throw new Error("Please select both class and session for class teacher assignment.");
    }

    const existingAssignment = classTeacherAssignments.find(
      (item) => item.teacher === teacherId
    );

    const payload = {
      teacher: teacherId,
      school_class: Number(formData.school_class),
      session: Number(formData.session),
    };

    if (existingAssignment) {
      await updateAdminClassTeacherAssignment(existingAssignment.id, payload);
    } else {
      await createAdminClassTeacherAssignment(payload);
    }
  }

  async function handleCreateTeacher(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const payload = new FormData();
      payload.append("full_name", formData.full_name);
      payload.append("username", formData.username);
      payload.append("password", formData.password);
      payload.append("staff_id", formData.staff_id);

      if (formData.phone_number) {
        payload.append("phone_number", formData.phone_number);
      }

      payload.append("branches", JSON.stringify(formData.branches.map(Number)));
      payload.append("sections", JSON.stringify(formData.sections.map(Number)));

      if (profilePictureFile) {
        payload.append("profile_picture", profilePictureFile);
      }

      const created = await createAdminTeacher(payload);

      const newTeacherId =
        created?.teacher?.id ||
        created?.id ||
        created?.data?.id;

      if (formData.assign_as_class_teacher && newTeacherId) {
        await saveClassTeacherAssignment(Number(newTeacherId));
      }

      setFormSuccess("Teacher created successfully.");
      await Promise.all([loadTeachers(), loadFormOptions()]);

      setTimeout(() => {
        closeCreateModal();
      }, 800);
    } catch (err: unknown) {
      console.error(err);

      if (err instanceof Error && !("response" in (err as object))) {
        setFormError(err.message);
      } else {
        const axiosError = err as AxiosError<ApiErrorData>;
        const apiError = axiosError.response?.data;
        setFormError(getErrorMessage(apiError));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditTeacher(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingTeacherId) return;

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const payload = new FormData();
      payload.append("full_name", formData.full_name);
      payload.append("username", formData.username);
      payload.append("staff_id", formData.staff_id);

      if (formData.phone_number) {
        payload.append("phone_number", formData.phone_number);
      }

      payload.append("branches", JSON.stringify(formData.branches.map(Number)));
      payload.append("sections", JSON.stringify(formData.sections.map(Number)));

      if (profilePictureFile) {
        payload.append("profile_picture", profilePictureFile);
      }

      await updateAdminTeacher(editingTeacherId, payload);

      if (formData.assign_as_class_teacher) {
        await saveClassTeacherAssignment(editingTeacherId);
      }

      setFormSuccess("Teacher updated successfully.");
      await Promise.all([loadTeachers(), loadFormOptions()]);

      setTimeout(() => {
        closeEditModal();
      }, 800);
    } catch (err: unknown) {
      console.error(err);

      if (err instanceof Error && !("response" in (err as object))) {
        setFormError(err.message);
      } else {
        const axiosError = err as AxiosError<ApiErrorData>;
        const apiError = axiosError.response?.data;
        setFormError(getErrorMessage(apiError));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const classOptions = schoolClasses.map((item) => ({
    value: String(item.id),
    label: `${item.name}${item.arm ? ` ${item.arm}` : ""}${item.section_name ? ` - ${item.section_name}` : ""}${item.branch_name ? ` - ${item.branch_name}` : ""}`,
  }));

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin"
        heading="Manage Teachers"
        subtext="View and manage all teacher records"
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
        </div>
        
        <div className="space-y-6">
          <SectionCard title="Teachers Overview">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Teachers</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {teachers.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Displayed Teachers</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredTeachers.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Branches Represented</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {
                    new Set(
                      teachers.flatMap((teacher) => teacher.branch_names || [])
                    ).size
                  }
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Search Teachers">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-md flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search by name, username, staff ID, branch, or section
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search teachers..."
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
                Add Teacher
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Teacher Records">
            {loading && (
              <p className="text-sm text-slate-500">Loading teachers...</p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && filteredTeachers.length === 0 && (
              <p className="text-sm text-slate-500">No teachers found.</p>
            )}

            {!loading && !error && filteredTeachers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Teacher Name</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Staff ID</th>
                      <th className="px-4 py-3">Branches</th>
                      <th className="px-4 py-3">Sections</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((teacher) => (
                      <tr key={teacher.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {teacher.teacher_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {teacher.username}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {teacher.staff_id || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {teacher.branch_names?.length
                            ? teacher.branch_names.join(", ")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {teacher.section_names?.length
                            ? teacher.section_names.join(", ")
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              teacher.is_active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {teacher.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(teacher)}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleTeacherStatus(teacher)}
                              className={`rounded-lg px-3 py-2 text-xs font-medium text-white ${
                                teacher.is_active
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-emerald-600 hover:bg-emerald-700"
                              }`}
                            >
                              {teacher.is_active ? "Deactivate" : "Activate"}
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

        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {showCreateModal ? "Create Teacher" : "Edit Teacher"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {showCreateModal
                      ? "Add a new teacher to the portal"
                      : "Update teacher profile details"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={showCreateModal ? closeCreateModal : closeEditModal}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={showCreateModal ? handleCreateTeacher : handleEditTeacher}
                className="space-y-6 p-6"
              >
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

                  {showCreateModal && (
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
                  )}

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
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
                    />
                    {profilePictureFile ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Selected: {profilePictureFile.name}
                      </p>
                    ) : !showCreateModal ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Leave empty to keep the current profile picture.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Staff ID
                    </label>
                    <input
                      type="text"
                      name="staff_id"
                      value={formData.staff_id}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Branches
                    </label>
                    <div className="grid gap-2 rounded-xl border border-slate-200 p-4 md:grid-cols-2">
                      {branches.map((branch) => (
                        <label
                          key={branch.id}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <input
                            type="checkbox"
                            checked={formData.branches.includes(String(branch.id))}
                            onChange={(e) =>
                              handleMultiSelectChange(
                                "branches",
                                String(branch.id),
                                e.target.checked
                              )
                            }
                          />
                          <span>{branch.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Sections
                    </label>
                    <div className="grid gap-2 rounded-xl border border-slate-200 p-4 md:grid-cols-2">
                      {sections.map((section) => (
                        <label
                          key={section.id}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <input
                            type="checkbox"
                            checked={formData.sections.includes(String(section.id))}
                            onChange={(e) =>
                              handleMultiSelectChange(
                                "sections",
                                String(section.id),
                                e.target.checked
                              )
                            }
                          />
                          <span>{section.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
                      <input
                        type="checkbox"
                        name="assign_as_class_teacher"
                        checked={formData.assign_as_class_teacher}
                        onChange={handleInputChange}
                      />
                      <span>Assign as class teacher</span>
                    </label>

                    {formData.assign_as_class_teacher && (
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Class
                          </label>
                          <select
                            name="school_class"
                            value={formData.school_class}
                            onChange={handleInputChange}
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
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={showCreateModal ? closeCreateModal : closeEditModal}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? showCreateModal
                        ? "Creating..."
                        : "Saving..."
                      : showCreateModal
                      ? "Create Teacher"
                      : "Save Changes"}
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