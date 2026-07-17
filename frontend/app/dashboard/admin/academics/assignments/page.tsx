"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  CreditCard,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Square,
  Users,
  X,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";

import {
  createAdminAssignments,
  getAdminAssignments,
  getAdminClassSubjects,
  getAssignmentTeachers,
  getBranches,
  getSchoolClasses,
  getSections,
  updateAdminAssignment,
} from "@/services/adminService";

interface AssignmentItem {
  id: number;
  teacher: number;
  teacher_name: string;
  class_subject: number;
  subject_name: string;
  subject_code?: string | null;
  class_name: string;
  class_arm?: string | null;
  branch_name?: string | null;
  section_name?: string | null;
  session_name?: string | null;
}

interface TeacherItem {
  id: number;
  teacher_name: string;
  username?: string;
  staff_id?: string;
}

interface BranchItem {
  id: number;
  name: string;
}

interface SectionItem {
  id: number;
  name: string;
}

interface SchoolClassItem {
  id: number;
  name: string;
  arm?: string | null;
  branch: number;
  branch_name?: string | null;
  section: number;
  section_name?: string | null;
}

interface ClassSubjectItem {
  id: number;

  school_class: number;
  school_class_id?: number;

  class_name: string;
  class_arm?: string | null;

  branch: number;
  branch_name?: string | null;

  section: number;
  section_name?: string | null;

  subject: number;
  subject_name: string;
  subject_code?: string | null;

  session: number;
  session_name?: string | null;

  display_name?: string;
}

interface ApiErrorData {
  detail?: string;
  [key: string]: unknown;
}

const adminSidebarItems = [
  {
    label: "Dashboard",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Students",
    href: "/dashboard/admin/students",
    icon: GraduationCap,
  },
  {
    label: "Teachers",
    href: "/dashboard/admin/teachers",
    icon: Users,
  },
  {
    label: "Academics",
    href: "/dashboard/admin/academics",
    icon: BookOpen,
  },
  {
    label: "Finance",
    href: "/dashboard/admin/finance",
    icon: CreditCard,
  },
  {
    label: "Result PINs",
    href: "/dashboard/admin/pins",
    icon: KeyRound,
  },
  {
    label: "Settings",
    href: "/dashboard/admin/settings",
    icon: Settings,
  },
];

const initialEditForm = {
  teacher: "",
  class_subject: "",
};

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [classes, setClasses] = useState<SchoolClassItem[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubjectItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editingAssignmentId, setEditingAssignmentId] = useState<
    number | null
  >(null);

  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedClassSubjectIds, setSelectedClassSubjectIds] = useState<
    number[]
  >([]);

  const [editFormData, setEditFormData] = useState(initialEditForm);

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

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
    setLoadingOptions(true);
    setFormError("");

    const [
      teacherData,
      branchData,
      sectionData,
      classData,
      classSubjectData,
    ] = await Promise.all([
      getAssignmentTeachers(),
      getBranches(),
      getSections(),
      getSchoolClasses(),
      getAdminClassSubjects(),
    ]);

    setTeachers(Array.isArray(teacherData) ? teacherData : []);
    setBranches(Array.isArray(branchData) ? branchData : []);
    setSections(Array.isArray(sectionData) ? sectionData : []);
    setClasses(Array.isArray(classData) ? classData : []);

    console.log(
  "Class Subjects API:",
  JSON.stringify(classSubjectData, null, 2)
);

    const resolvedClassSubjects = Array.isArray(classSubjectData)
      ? classSubjectData
      : Array.isArray(classSubjectData?.results)
      ? classSubjectData.results
      : [];

    console.log("Resolved Class Subjects:", resolvedClassSubjects);

    setClassSubjects(resolvedClassSubjects);
  } catch (err) {
    console.error(err);
    setFormError("Failed to load assignment options.");
  } finally {
    setLoadingOptions(false);
  }
}

  useEffect(() => {
    loadAssignments();
    loadOptions();
  }, []);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return assignments;
    }

    return assignments.filter((item) => {
      return (
        item.teacher_name.toLowerCase().includes(query) ||
        item.subject_name.toLowerCase().includes(query) ||
        (item.subject_code || "").toLowerCase().includes(query) ||
        item.class_name.toLowerCase().includes(query) ||
        (item.class_arm || "").toLowerCase().includes(query) ||
        (item.branch_name || "").toLowerCase().includes(query) ||
        (item.section_name || "").toLowerCase().includes(query) ||
        (item.session_name || "").toLowerCase().includes(query)
      );
    });
  }, [assignments, search]);

  const filteredClasses = useMemo(() => {
    return classes.filter((item) => {
      const branchMatches =
        !selectedBranch || String(item.branch) === selectedBranch;

      const sectionMatches =
        !selectedSection || String(item.section) === selectedSection;

      return branchMatches && sectionMatches;
    });
  }, [classes, selectedBranch, selectedSection]);

  const availableClassSubjects = useMemo(() => {
  if (!selectedClass) {
    return [];
  }

  const selectedClassId = Number(selectedClass);
  const query = subjectSearch.trim().toLowerCase();

  return classSubjects
    .filter((item) => {
      const itemClassId = Number(
        item.school_class ??
        (item as ClassSubjectItem & { school_class_id?: number }).school_class_id
      );

      return itemClassId === selectedClassId;
    })
    .filter((item) => {
      if (!query) {
        return true;
      }

      return (
        item.subject_name.toLowerCase().includes(query) ||
        (item.subject_code || "").toLowerCase().includes(query) ||
        (item.session_name || "").toLowerCase().includes(query)
      );
    })
    .sort((first, second) =>
      first.subject_name.localeCompare(second.subject_name)
    );
}, [classSubjects, selectedClass, subjectSearch]);

  const allVisibleSubjectsSelected =
    availableClassSubjects.length > 0 &&
    availableClassSubjects.every((item) =>
      selectedClassSubjectIds.includes(item.id)
    );

  const assignedTeacherCount = useMemo(() => {
    return new Set(assignments.map((item) => item.teacher)).size;
  }, [assignments]);

  const coveredSubjectCount = useMemo(() => {
    return new Set(
      assignments.map(
        (item) =>
          `${item.class_name}-${item.class_arm}-${item.subject_name}`
      )
    ).size;
  }, [assignments]);

  function getErrorMessage(
    apiError: ApiErrorData | undefined
  ): string {
    if (!apiError) {
      return "Request failed.";
    }

    if (typeof apiError.detail === "string") {
      return apiError.detail;
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

  function clearMessages() {
    setFormError("");
    setFormSuccess("");
  }

  function resetCreateForm() {
    setSelectedTeacher("");
    setSelectedBranch("");
    setSelectedSection("");
    setSelectedClass("");
    setSelectedClassSubjectIds([]);
    setSubjectSearch("");
    clearMessages();
  }

  function resetEditForm() {
    setEditFormData(initialEditForm);
    clearMessages();
  }

  function openCreateModal() {
    resetCreateForm();
    setEditingAssignmentId(null);
    setShowEditModal(false);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    resetCreateForm();
  }

  function openEditModal(item: AssignmentItem) {
    clearMessages();

    setEditingAssignmentId(item.id);

    setEditFormData({
      teacher: String(item.teacher),
      class_subject: String(item.class_subject),
    });

    setShowCreateModal(false);
    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingAssignmentId(null);
    resetEditForm();
  }

  function handleBranchChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setSelectedBranch(event.target.value);
    setSelectedSection("");
    setSelectedClass("");
    setSelectedClassSubjectIds([]);
    setSubjectSearch("");
    clearMessages();
  }

  function handleSectionChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setSelectedSection(event.target.value);
    setSelectedClass("");
    setSelectedClassSubjectIds([]);
    setSubjectSearch("");
    clearMessages();
  }

  function handleClassChange(
  event: ChangeEvent<HTMLSelectElement>
) {
  const classId = event.target.value;

  console.log("Selected Class:", classId);
  console.log("All Loaded Class Subjects:", classSubjects);

  setSelectedClass(classId);
  setSelectedClassSubjectIds([]);
  setSubjectSearch("");
  clearMessages();
}

  function toggleClassSubject(classSubjectId: number) {
    setSelectedClassSubjectIds((previous) => {
      if (previous.includes(classSubjectId)) {
        return previous.filter(
          (id) => id !== classSubjectId
        );
      }

      return [...previous, classSubjectId];
    });
  }

  function toggleAllVisibleSubjects() {
    const visibleIds = availableClassSubjects.map(
      (item) => item.id
    );

    if (allVisibleSubjectsSelected) {
      const visibleIdSet = new Set(visibleIds);

      setSelectedClassSubjectIds((previous) =>
        previous.filter((id) => !visibleIdSet.has(id))
      );

      return;
    }

    setSelectedClassSubjectIds((previous) => {
      const nextIds = new Set(previous);

      visibleIds.forEach((id) => nextIds.add(id));

      return Array.from(nextIds);
    });
  }

  async function handleCreateAssignments(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    clearMessages();

    if (!selectedTeacher) {
      setFormError("Select a teacher.");
      return;
    }

    if (!selectedBranch) {
      setFormError("Select a branch.");
      return;
    }

    if (!selectedSection) {
      setFormError("Select a section.");
      return;
    }

    if (!selectedClass) {
      setFormError("Select a class.");
      return;
    }

    if (selectedClassSubjectIds.length === 0) {
      setFormError("Select at least one subject.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createAdminAssignments({
        teacher: Number(selectedTeacher),
        class_subjects: selectedClassSubjectIds,
      });

      setFormSuccess(
        response.message ||
          "Teacher assignments created successfully."
      );

      await loadAssignments();

      setSelectedClassSubjectIds([]);

      setTimeout(() => {
        closeCreateModal();
      }, 1500);
    } catch (err: unknown) {
      console.error(err);

      const axiosError = err as AxiosError<ApiErrorData>;

      setFormError(
        getErrorMessage(axiosError.response?.data)
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditInputChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setEditFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleEditAssignment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingAssignmentId) {
      return;
    }

    clearMessages();

    try {
      setSubmitting(true);

      await updateAdminAssignment(editingAssignmentId, {
        teacher: Number(editFormData.teacher),
        class_subject: Number(
          editFormData.class_subject
        ),
      });

      setFormSuccess("Assignment updated successfully.");

      await loadAssignments();

      setTimeout(() => {
        closeEditModal();
      }, 800);
    } catch (err: unknown) {
      console.error(err);

      const axiosError = err as AxiosError<ApiErrorData>;

      setFormError(
        getErrorMessage(axiosError.response?.data)
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin"
        heading="Teacher Assignments"
        subtext="Assign teachers to multiple class subjects"
        sidebarItems={adminSidebarItems}
      >
        <div className="space-y-6">
          <SectionCard title="Navigation">
            <Link
              href="/dashboard/admin/academics"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Back to Academics
            </Link>
          </SectionCard>

          <SectionCard title="Assignments Overview">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Total Assignments
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {assignments.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Displayed Assignments
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredAssignments.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Teachers Assigned
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {assignedTeacherCount}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Class Subjects Covered
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {coveredSubjectCount}
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Search Assignments">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-md flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search by teacher, subject, class, branch,
                  section or session
                </label>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <Search
                    size={16}
                    className="text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
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
                Assign Subjects
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Assignment Records">
            {loading && (
              <p className="text-sm text-slate-500">
                Loading assignments...
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            {!loading &&
              !error &&
              filteredAssignments.length === 0 && (
                <p className="text-sm text-slate-500">
                  No assignments found.
                </p>
              )}

            {!loading &&
              !error &&
              filteredAssignments.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                        <th className="px-4 py-3">
                          Teacher
                        </th>
                        <th className="px-4 py-3">
                          Subject
                        </th>
                        <th className="px-4 py-3">
                          Class
                        </th>
                        <th className="px-4 py-3">
                          Branch
                        </th>
                        <th className="px-4 py-3">
                          Section
                        </th>
                        <th className="px-4 py-3">
                          Session
                        </th>
                        <th className="px-4 py-3">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAssignments.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {item.teacher_name}
                          </td>

                          <td className="px-4 py-3 text-slate-700">
                            {item.subject_name}
                            {item.subject_code
                              ? ` (${item.subject_code})`
                              : ""}
                          </td>

                          <td className="px-4 py-3 text-slate-700">
                            {item.class_name}
                            {item.class_arm
                              ? ` ${item.class_arm}`
                              : ""}
                          </td>

                          <td className="px-4 py-3 text-slate-700">
                            {item.branch_name || "-"}
                          </td>

                          <td className="px-4 py-3 text-slate-700">
                            {item.section_name || "-"}
                          </td>

                          <td className="px-4 py-3 text-slate-700">
                            {item.session_name || "-"}
                          </td>

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(item)
                              }
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
            <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Assign Subjects to Teacher
                  </h2>

                  <p className="text-sm text-slate-500">
                    Select a teacher, class and multiple
                    subjects
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close assignment form"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={handleCreateAssignments}
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

                {loadingOptions ? (
                  <p className="text-sm text-slate-500">
                    Loading assignment options...
                  </p>
                ) : (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Teacher
                      </label>

                      <select
                        value={selectedTeacher}
                        onChange={(event) => {
                          setSelectedTeacher(
                            event.target.value
                          );
                          clearMessages();
                        }}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                      >
                        <option value="">
                          Select teacher
                        </option>

                        {teachers.map((teacher) => (
                          <option
                            key={teacher.id}
                            value={teacher.id}
                          >
                            {teacher.teacher_name}
                            {teacher.staff_id
                              ? ` (${teacher.staff_id})`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Branch
                        </label>

                        <select
                          value={selectedBranch}
                          onChange={handleBranchChange}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                        >
                          <option value="">
                            Select branch
                          </option>

                          {branches.map((branch) => (
                            <option
                              key={branch.id}
                              value={branch.id}
                            >
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
                          value={selectedSection}
                          onChange={handleSectionChange}
                          required
                          disabled={!selectedBranch}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          <option value="">
                            Select section
                          </option>

                          {sections.map((section) => (
                            <option
                              key={section.id}
                              value={section.id}
                            >
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
                          value={selectedClass}
                          onChange={handleClassChange}
                          required
                          disabled={!selectedSection}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          <option value="">
                            Select class
                          </option>

                          {filteredClasses.map((item) => (
                            <option
                              key={item.id}
                              value={item.id}
                            >
                              {item.name}
                              {item.arm
                                ? ` ${item.arm}`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200">
                      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Class Subjects
                          </h3>

                          <p className="text-sm text-slate-500">
                            {
                              availableClassSubjects.length
                            }{" "}
                            subject(s) shown ·{" "}
                            {
                              selectedClassSubjectIds.length
                            }{" "}
                            selected
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <Search
                              size={16}
                              className="text-slate-400"
                            />

                            <input
                              type="text"
                              value={subjectSearch}
                              onChange={(event) =>
                                setSubjectSearch(
                                  event.target.value
                                )
                              }
                              placeholder="Search subjects..."
                              className="w-full bg-transparent text-sm outline-none sm:w-56"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={
                              toggleAllVisibleSubjects
                            }
                            disabled={
                              availableClassSubjects.length ===
                              0
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {allVisibleSubjectsSelected ? (
                              <CheckSquare size={17} />
                            ) : (
                              <Square size={17} />
                            )}

                            {allVisibleSubjectsSelected
                              ? "Unselect Visible"
                              : "Select Visible"}
                          </button>
                        </div>
                      </div>

                      <div className="max-h-80 overflow-y-auto p-4">
                        {!selectedClass && (
                          <p className="text-sm text-slate-500">
                            Select a class to display its
                            subjects.
                          </p>
                        )}

                        {selectedClass &&
                          availableClassSubjects.length ===
                            0 && (
                            <p className="text-sm text-slate-500">
                              No class subjects were found for
                              this class. Create class subjects
                              before assigning a teacher.
                            </p>
                          )}

                        {availableClassSubjects.length > 0 && (
                          <div className="grid gap-3 md:grid-cols-2">
                            {availableClassSubjects.map(
                              (item) => {
                                const selected =
                                  selectedClassSubjectIds.includes(
                                    item.id
                                  );

                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                      toggleClassSubject(
                                        item.id
                                      )
                                    }
                                    className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                                      selected
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                    }`}
                                  >
                                    <div>
                                      <p className="font-medium text-slate-900">
                                        {
                                          item.subject_name
                                        }
                                      </p>

                                      <p className="mt-1 text-xs text-slate-500">
                                        {item.subject_code ||
                                          "No subject code"}
                                        {item.session_name
                                          ? ` · ${item.session_name}`
                                          : ""}
                                      </p>
                                    </div>

                                    {selected ? (
                                      <CheckSquare
                                        size={20}
                                        className="text-blue-600"
                                      />
                                    ) : (
                                      <Square
                                        size={20}
                                        className="text-slate-400"
                                      />
                                    )}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !selectedTeacher ||
                      selectedClassSubjectIds.length === 0
                    }
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? "Assigning..."
                      : `Assign Selected Subjects (${selectedClassSubjectIds.length})`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Edit Assignment
                  </h2>

                  <p className="text-sm text-slate-500">
                    Update one existing teacher assignment
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close edit form"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={handleEditAssignment}
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

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Teacher
                    </label>

                    <select
                      name="teacher"
                      value={editFormData.teacher}
                      onChange={handleEditInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">
                        Select teacher
                      </option>

                      {teachers.map((teacher) => (
                        <option
                          key={teacher.id}
                          value={teacher.id}
                        >
                          {teacher.teacher_name}
                          {teacher.staff_id
                            ? ` (${teacher.staff_id})`
                            : ""}
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
                      value={editFormData.class_subject}
                      onChange={handleEditInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">
                        Select class subject
                      </option>

                      {classSubjects.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.display_name ||
                            `${item.subject_name} — ${item.class_name}${
                              item.class_arm
                                ? ` ${item.class_arm}`
                                : ""
                            }`}
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
                    {submitting
                      ? "Saving..."
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