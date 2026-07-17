"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  CheckSquare,
  Square,
  UsersRound,
} from "lucide-react";
import { AxiosError } from "axios";
import {
  getBranches,
  getSections,
  getSchoolClasses,
  getAdminFeeStructures,
  getAdminStudentFees,
  getFeeAssignmentStudents,
  assignAdminStudentFees,
  updateAdminStudentFee,
} from "@/services/adminService";

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
  branch?: number;
  branch_name?: string | null;
  section?: number;
  section_name?: string | null;
}

interface StudentItem {
  id: number;
  student_name: string;
  admission_number?: string | null;
  branch?: number;
  branch_name?: string | null;
  section?: number;
  section_name?: string | null;
  school_class?: number;
  class_name?: string | null;
  class_arm?: string | null;
}

interface FeeStructureItem {
  id: number;
  branch: number;
  branch_name: string;
  section: number;
  section_name: string;
  school_class: number;
  class_name: string;
  class_arm?: string | null;
  term: number;
  term_name: string;
  name: string;
  amount: string;
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

const initialEditForm = {
  student: "",
  fee_structure: "",
};

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  return Number(value);
}

function formatCurrency(value: string | number | null | undefined) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

export default function AdminStudentFeesPage() {
  const [studentFees, setStudentFees] = useState<StudentFeeItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [classes, setClasses] = useState<SchoolClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [allStudents, setAllStudents] = useState<StudentItem[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudentFeeId, setEditingStudentFeeId] = useState<number | null>(
    null
  );

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedFeeStructure, setSelectedFeeStructure] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [editFormData, setEditFormData] = useState(initialEditForm);

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

  async function loadAssignmentOptions() {
    try {
      setLoadingOptions(true);
      setFormError("");

      const [
        branchData,
        sectionData,
        classData,
        feeStructureData,
        studentData,
      ] = await Promise.all([
        getBranches(),
        getSections(),
        getSchoolClasses(),
        getAdminFeeStructures(),
        getFeeAssignmentStudents(),
      ]);

      setBranches(Array.isArray(branchData) ? branchData : []);
      setSections(Array.isArray(sectionData) ? sectionData : []);
      setClasses(Array.isArray(classData) ? classData : []);
      setFeeStructures(
        Array.isArray(feeStructureData) ? feeStructureData : []
      );
      setAllStudents(Array.isArray(studentData) ? studentData : []);
    } catch (err) {
      console.error(err);
      setFormError("Failed to load fee assignment options.");
    } finally {
      setLoadingOptions(false);
    }
  }

  async function loadStudentsForClass(classId: string) {
    if (!classId) {
      setStudents([]);
      setSelectedStudentIds([]);
      return;
    }

    try {
      setLoadingStudents(true);
      setFormError("");

      const data = await getFeeAssignmentStudents({
        branch: selectedBranch,
        section: selectedSection,
        school_class: classId,
      });

      setStudents(Array.isArray(data) ? data : []);
      setSelectedStudentIds([]);
    } catch (err) {
      console.error(err);
      setStudents([]);
      setFormError("Failed to load students for the selected class.");
    } finally {
      setLoadingStudents(false);
    }
  }

  useEffect(() => {
    loadStudentFees();
  }, []);

  useEffect(() => {
    if (showCreateModal || showEditModal) {
      loadAssignmentOptions();
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

  const filteredClasses = useMemo(() => {
    return classes.filter((item) => {
      const branchMatches =
        !selectedBranch || String(item.branch) === selectedBranch;

      const sectionMatches =
        !selectedSection || String(item.section) === selectedSection;

      return branchMatches && sectionMatches;
    });
  }, [classes, selectedBranch, selectedSection]);

  const availableFeeStructures = useMemo(() => {
    return feeStructures.filter((item) => {
      const branchMatches =
        !selectedBranch || String(item.branch) === selectedBranch;

      const sectionMatches =
        !selectedSection || String(item.section) === selectedSection;

      const classMatches =
        !selectedClass || String(item.school_class) === selectedClass;

      return branchMatches && sectionMatches && classMatches;
    });
  }, [
    feeStructures,
    selectedBranch,
    selectedSection,
    selectedClass,
  ]);

  const visibleStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();

    if (!q) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.student_name.toLowerCase().includes(q) ||
        (student.admission_number || "").toLowerCase().includes(q)
      );
    });
  }, [students, studentSearch]);

  const totalAssigned = useMemo(() => {
    return filteredStudentFees.reduce(
      (sum, item) => sum + toNumber(item.fee_amount),
      0
    );
  }, [filteredStudentFees]);

  const totalPaid = useMemo(() => {
    return filteredStudentFees.reduce(
      (sum, item) => sum + toNumber(item.total_paid),
      0
    );
  }, [filteredStudentFees]);

  const totalBalance = useMemo(() => {
    return filteredStudentFees.reduce(
      (sum, item) => sum + toNumber(item.balance),
      0
    );
  }, [filteredStudentFees]);

  const allVisibleStudentsSelected =
    visibleStudents.length > 0 &&
    visibleStudents.every((student) =>
      selectedStudentIds.includes(student.id)
    );

  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  function getErrorMessage(apiError: ApiErrorData | undefined): string {
    if (!apiError) {
      return "Request failed.";
    }

    const detail = apiError.detail;

    if (typeof detail === "string") {
      return detail;
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

  function resetCreateForm() {
    setSelectedBranch("");
    setSelectedSection("");
    setSelectedClass("");
    setSelectedFeeStructure("");
    setSelectedStudentIds([]);
    setStudentSearch("");
    setStudents([]);
    setFormError("");
    setFormSuccess("");
  }

  function resetEditForm() {
    setEditFormData(initialEditForm);
    setFormError("");
    setFormSuccess("");
  }

  function openCreateModal() {
    resetCreateForm();
    setEditingStudentFeeId(null);
    setShowEditModal(false);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    resetCreateForm();
  }

  function openEditModal(item: StudentFeeItem) {
    setFormError("");
    setFormSuccess("");
    setEditingStudentFeeId(item.id);
    setShowCreateModal(false);

    setEditFormData({
      student: String(item.student),
      fee_structure: String(item.fee_structure),
    });

    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingStudentFeeId(null);
    resetEditForm();
  }

  function handleBranchChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;

    setSelectedBranch(value);
    setSelectedSection("");
    setSelectedClass("");
    setSelectedFeeStructure("");
    setSelectedStudentIds([]);
    setStudents([]);
  }

  function handleSectionChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;

    setSelectedSection(value);
    setSelectedClass("");
    setSelectedFeeStructure("");
    setSelectedStudentIds([]);
    setStudents([]);
  }

  async function handleClassChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;

    setSelectedClass(value);
    setSelectedFeeStructure("");
    setSelectedStudentIds([]);
    setStudentSearch("");

    await loadStudentsForClass(value);
  }

  function handleStudentToggle(studentId: number) {
    setSelectedStudentIds((previous) => {
      if (previous.includes(studentId)) {
        return previous.filter((id) => id !== studentId);
      }

      return [...previous, studentId];
    });
  }

  function handleToggleAllVisibleStudents() {
    if (allVisibleStudentsSelected) {
      const visibleIds = new Set(
        visibleStudents.map((student) => student.id)
      );

      setSelectedStudentIds((previous) =>
        previous.filter((id) => !visibleIds.has(id))
      );

      return;
    }

    setSelectedStudentIds((previous) => {
      const nextIds = new Set(previous);

      visibleStudents.forEach((student) => {
        nextIds.add(student.id);
      });

      return Array.from(nextIds);
    });
  }

  async function assignFees(studentIds: number[]) {
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

    if (!selectedFeeStructure) {
      setFormError("Select a fee structure.");
      return;
    }

    if (studentIds.length === 0) {
      setFormError("Select at least one student.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const response = await assignAdminStudentFees({
        students: studentIds,
        fee_structure: Number(selectedFeeStructure),
      });

      setFormSuccess(
        response.message || "Fees assigned successfully."
      );

      await loadStudentFees();

      setSelectedStudentIds([]);

      setTimeout(() => {
        closeCreateModal();
      }, 1200);
    } catch (err: unknown) {
      console.error(err);

      const axiosError = err as AxiosError<ApiErrorData>;
      setFormError(getErrorMessage(axiosError.response?.data));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssignSelected(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    await assignFees(selectedStudentIds);
  }

  async function handleAssignEntireClass() {
    await assignFees(students.map((student) => student.id));
  }

  function handleEditInputChange(
    e: ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setEditFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleEditStudentFee(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!editingStudentFeeId) {
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      await updateAdminStudentFee(editingStudentFeeId, {
        student: Number(editFormData.student),
        fee_structure: Number(editFormData.fee_structure),
      });

      setFormSuccess("Assigned fee updated successfully.");

      await loadStudentFees();

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
        heading="Assign Fees to Students"
        subtext="Assign fee structures by branch, section, and class"
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
                <p className="text-sm text-slate-500">
                  Assigned Records
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredStudentFees.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Total Assigned
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(totalAssigned)}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Total Paid
                </p>
                <h3 className="mt-2 text-2xl font-bold text-green-700">
                  {formatCurrency(totalPaid)}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Outstanding Balance
                </p>
                <h3 className="mt-2 text-2xl font-bold text-red-700">
                  {formatCurrency(totalBalance)}
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Search Assigned Fees">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-md flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search by student, admission number, fee, class,
                  term, branch, or section
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
                Assign Fees
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Assigned Fee Records">
            {loading && (
              <p className="text-sm text-slate-500">
                Loading assigned fees...
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {!loading &&
              !error &&
              filteredStudentFees.length === 0 && (
                <p className="text-sm text-slate-500">
                  No assigned fees found.
                </p>
              )}

            {!loading &&
              !error &&
              filteredStudentFees.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">
                          Admission No
                        </th>
                        <th className="px-4 py-3">Fee Name</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Class</th>
                        <th className="px-4 py-3">Branch</th>
                        <th className="px-4 py-3">Term</th>
                        <th className="px-4 py-3">Paid</th>
                        <th className="px-4 py-3">Balance</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredStudentFees.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100"
                        >
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
                            {formatCurrency(item.fee_amount)}
                          </td>

                          <td className="px-4 py-3 text-slate-700">
                            {item.class_name}
                            {item.class_arm
                              ? ` ${item.class_arm}`
                              : ""}
                          </td>

                          <td className="px-4 py-3 text-slate-700">
                            {item.branch_name}
                          </td>

                          <td className="px-4 py-3 text-slate-700">
                            {item.term_name}
                          </td>

                          <td className="px-4 py-3 font-medium text-green-700">
                            {formatCurrency(item.total_paid)}
                          </td>

                          <td className="px-4 py-3 font-medium text-red-700">
                            {formatCurrency(item.balance)}
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
            <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Assign Fees
                  </h2>
                  <p className="text-sm text-slate-500">
                    Select the branch, section, class, students, and
                    fee structure
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

              <form
                onSubmit={handleAssignSelected}
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
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Branch
                        </label>

                        <select
                          value={selectedBranch}
                          onChange={handleBranchChange}
                          required
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
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
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
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

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Fee Structure
                      </label>

                      <select
                        value={selectedFeeStructure}
                        onChange={(e) =>
                          setSelectedFeeStructure(e.target.value)
                        }
                        required
                        disabled={!selectedClass}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        <option value="">
                          Select fee structure
                        </option>

                        {availableFeeStructures.map((item) => (
                          <option
                            key={item.id}
                            value={item.id}
                          >
                            {item.name} — {item.term_name} —{" "}
                            {formatCurrency(item.amount)}
                          </option>
                        ))}
                      </select>

                      {selectedClass &&
                        availableFeeStructures.length === 0 && (
                          <p className="mt-2 text-sm text-amber-700">
                            No fee structure has been created for
                            this class.
                          </p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200">
                      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Students
                          </h3>

                          <p className="text-sm text-slate-500">
                            {students.length} student(s) found •{" "}
                            {selectedStudentIds.length} selected
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
                              value={studentSearch}
                              onChange={(e) =>
                                setStudentSearch(e.target.value)
                              }
                              placeholder="Search students..."
                              className="w-full bg-transparent text-sm outline-none sm:w-56"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={
                              handleToggleAllVisibleStudents
                            }
                            disabled={
                              visibleStudents.length === 0
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {allVisibleStudentsSelected ? (
                              <CheckSquare size={17} />
                            ) : (
                              <Square size={17} />
                            )}

                            {allVisibleStudentsSelected
                              ? "Unselect Visible"
                              : "Select Visible"}
                          </button>
                        </div>
                      </div>

                      <div className="max-h-80 overflow-y-auto p-4">
                        {!selectedClass && (
                          <p className="text-sm text-slate-500">
                            Select a class to display students.
                          </p>
                        )}

                        {loadingStudents && (
                          <p className="text-sm text-slate-500">
                            Loading students...
                          </p>
                        )}

                        {!loadingStudents &&
                          selectedClass &&
                          students.length === 0 && (
                            <p className="text-sm text-slate-500">
                              No active students were found in this
                              class.
                            </p>
                          )}

                        {!loadingStudents &&
                          visibleStudents.length > 0 && (
                            <div className="grid gap-3 md:grid-cols-2">
                              {visibleStudents.map((student) => {
                                const selected =
                                  selectedStudentIds.includes(
                                    student.id
                                  );

                                return (
                                  <button
                                    key={student.id}
                                    type="button"
                                    onClick={() =>
                                      handleStudentToggle(
                                        student.id
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
                                        {student.student_name}
                                      </p>

                                      <p className="mt-1 text-xs text-slate-500">
                                        {student.admission_number ||
                                          "No admission number"}
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
                              })}
                            </div>
                          )}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleAssignEntireClass}
                      disabled={
                        submitting ||
                        students.length === 0 ||
                        !selectedFeeStructure
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-900 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <UsersRound size={17} />
                      Assign Entire Class
                    </button>

                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        selectedStudentIds.length === 0 ||
                        !selectedFeeStructure
                      }
                      className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting
                        ? "Assigning..."
                        : `Assign to Selected (${selectedStudentIds.length})`}
                    </button>
                  </div>
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

              <form
                onSubmit={handleEditStudentFee}
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
                      Student
                    </label>

                    <select
                      name="student"
                      value={editFormData.student}
                      onChange={handleEditInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">
                        Select student
                      </option>

                      {allStudents.map((student) => (
                        <option
                          key={student.id}
                          value={student.id}
                        >
                          {student.branch_name || "-"} —{" "}
                          {student.class_name || "-"}
                          {student.class_arm
                            ? ` ${student.class_arm}`
                            : ""}{" "}
                          — {student.student_name}
                          {student.admission_number
                            ? ` (${student.admission_number})`
                            : ""}
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
                      value={editFormData.fee_structure}
                      onChange={handleEditInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">
                        Select fee structure
                      </option>

                      {feeStructures.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.branch_name} —{" "}
                          {item.class_name}
                          {item.class_arm
                            ? ` ${item.class_arm}`
                            : ""}{" "}
                          — {item.name} — {item.term_name} —{" "}
                          {formatCurrency(item.amount)}
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