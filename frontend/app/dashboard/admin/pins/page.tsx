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
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import {
  getBranches,
  getSections,
  getSchoolClasses,
  getTerms,
  getAdminResultPins,
  getFeeAssignmentStudents,
  createAdminResultPins,
} from "@/services/adminService";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  Settings,
  KeyRound,
  ArrowLeft,
  Search,
  CheckSquare,
  Square,
  UsersRound,
} from "lucide-react";

interface BranchItem {
  id: number;
  name: string;
}

interface SectionItem {
  id: number;
  name: string;
}

interface ClassItem {
  id: number;
  name: string;
  arm?: string | null;
  branch?: number;
  section?: number;
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

interface TermItem {
  id: number;
  name: string;
}

interface ResultPinItem {
  id: number;
  student_name: string;
  term_name: string;
  pin: string;
  usage_count: number;
  max_usage: number;
  remaining_uses: number;
  is_used_up: boolean;
  created_at: string;
}

interface ApiErrorData {
  detail?: string;
  [key: string]: unknown;
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

export default function AdminPinsPage() {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [pins, setPins] = useState<ResultPinItem[]>([]);

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  const [studentSearch, setStudentSearch] = useState("");
  const [pinSearch, setPinSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  async function loadPins() {
    const pinsData = await getAdminResultPins();
    setPins(Array.isArray(pinsData) ? pinsData : []);
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [
          branchData,
          sectionData,
          classData,
          termsData,
          pinsData,
        ] = await Promise.all([
          getBranches(),
          getSections(),
          getSchoolClasses(),
          getTerms(),
          getAdminResultPins(),
        ]);

        setBranches(Array.isArray(branchData) ? branchData : []);
        setSections(Array.isArray(sectionData) ? sectionData : []);
        setClasses(Array.isArray(classData) ? classData : []);
        setTerms(Array.isArray(termsData) ? termsData : []);
        setPins(Array.isArray(pinsData) ? pinsData : []);
      } catch (error) {
        console.error(error);
        setMessage("Failed to load result PIN data.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredClasses = useMemo(() => {
    return classes.filter((item) => {
      const branchMatches =
        !selectedBranch || String(item.branch) === selectedBranch;

      const sectionMatches =
        !selectedSection || String(item.section) === selectedSection;

      return branchMatches && sectionMatches;
    });
  }, [classes, selectedBranch, selectedSection]);

  const visibleStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.student_name.toLowerCase().includes(query) ||
        (student.admission_number || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [students, studentSearch]);

  const filteredPins = useMemo(() => {
    const query = pinSearch.trim().toLowerCase();

    if (!query) {
      return pins;
    }

    return pins.filter((pin) => {
      return (
        pin.student_name.toLowerCase().includes(query) ||
        pin.term_name.toLowerCase().includes(query) ||
        pin.pin.toLowerCase().includes(query)
      );
    });
  }, [pins, pinSearch]);

  const allVisibleSelected =
    visibleStudents.length > 0 &&
    visibleStudents.every((student) =>
      selectedStudentIds.includes(student.id)
    );

  function clearMessages() {
    setMessage("");
    setMessageType("");
  }

  function handleBranchChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setSelectedBranch(event.target.value);
    setSelectedSection("");
    setSelectedClass("");
    setStudents([]);
    setSelectedStudentIds([]);
    setStudentSearch("");
    clearMessages();
  }

  function handleSectionChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setSelectedSection(event.target.value);
    setSelectedClass("");
    setStudents([]);
    setSelectedStudentIds([]);
    setStudentSearch("");
    clearMessages();
  }

  async function handleClassChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    const classId = event.target.value;

    setSelectedClass(classId);
    setSelectedStudentIds([]);
    setStudentSearch("");
    clearMessages();

    if (!classId) {
      setStudents([]);
      return;
    }

    try {
      setLoadingStudents(true);

      const data = await getFeeAssignmentStudents({
        branch: selectedBranch,
        section: selectedSection,
        school_class: classId,
      });

      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setStudents([]);
      setMessage("Failed to load students for the selected class.");
      setMessageType("error");
    } finally {
      setLoadingStudents(false);
    }
  }

  function toggleStudent(studentId: number) {
    setSelectedStudentIds((previous) => {
      if (previous.includes(studentId)) {
        return previous.filter((id) => id !== studentId);
      }

      return [...previous, studentId];
    });
  }

  function toggleAllVisible() {
    const visibleIds = visibleStudents.map((student) => student.id);

    if (allVisibleSelected) {
      const visibleIdSet = new Set(visibleIds);

      setSelectedStudentIds((previous) =>
        previous.filter((id) => !visibleIdSet.has(id))
      );

      return;
    }

    setSelectedStudentIds((previous) => {
      const nextIds = new Set(previous);

      visibleIds.forEach((id) => nextIds.add(id));

      return Array.from(nextIds);
    });
  }

  function getErrorMessage(error: unknown) {
    const axiosError = error as AxiosError<ApiErrorData>;

    return (
      axiosError.response?.data?.detail ||
      "Failed to generate result PINs."
    );
  }

  async function generatePins(studentIds: number[]) {
    clearMessages();

    if (!selectedBranch) {
      setMessage("Select a branch.");
      setMessageType("error");
      return;
    }

    if (!selectedSection) {
      setMessage("Select a section.");
      setMessageType("error");
      return;
    }

    if (!selectedClass) {
      setMessage("Select a class.");
      setMessageType("error");
      return;
    }

    if (!selectedTerm) {
      setMessage("Select a term.");
      setMessageType("error");
      return;
    }

    if (studentIds.length === 0) {
      setMessage("Select at least one student.");
      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createAdminResultPins({
        students: studentIds,
        term: Number(selectedTerm),
      });

      setMessage(
        response.message || "Result PINs generated successfully."
      );
      setMessageType("success");

      await loadPins();
      setSelectedStudentIds([]);
    } catch (error) {
      console.error(error);
      setMessage(getErrorMessage(error));
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    await generatePins(selectedStudentIds);
  }

  async function handleGenerateEntireClass() {
    await generatePins(students.map((student) => student.id));
  }

  function getStatusLabel(pin: ResultPinItem) {
    if (pin.is_used_up) return "Used Up";
    if (pin.usage_count > 0) return "Partially Used";
    return "Unused";
  }

  function getStatusClass(pin: ResultPinItem) {
    if (pin.is_used_up) return "bg-red-100 text-red-700";
    if (pin.usage_count > 0) {
      return "bg-amber-100 text-amber-700";
    }

    return "bg-green-100 text-green-700";
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin"
        heading="Result PIN Management"
        subtext="Generate result PINs by branch, section, and class"
        sidebarItems={adminSidebarItems}
      >
        <div className="space-y-6">
          <SectionCard title="Navigation">
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </SectionCard>

          <SectionCard title="Generate Result PINs">
            {loading ? (
              <p className="text-sm text-slate-500">
                Loading form data...
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {message && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm font-medium ${
                      messageType === "success"
                        ? "border border-green-200 bg-green-50 text-green-700"
                        : "border border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Branch
                    </label>

                    <select
                      value={selectedBranch}
                      onChange={handleBranchChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
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
                      value={selectedSection}
                      onChange={handleSectionChange}
                      disabled={!selectedBranch}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                      value={selectedClass}
                      onChange={handleClassChange}
                      disabled={!selectedSection}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="">Select class</option>

                      {filteredClasses.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {item.arm ? ` ${item.arm}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Term
                    </label>

                    <select
                      value={selectedTerm}
                      onChange={(event) =>
                        setSelectedTerm(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">Select term</option>

                      {terms.map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200">
                  <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Students
                      </h3>

                      <p className="text-sm text-slate-500">
                        {students.length} student(s) found ·{" "}
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
                          value={studentSearch}
                          onChange={(event) =>
                            setStudentSearch(event.target.value)
                          }
                          placeholder="Search students..."
                          className="w-full bg-transparent text-sm outline-none sm:w-56"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={toggleAllVisible}
                        disabled={visibleStudents.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {allVisibleSelected ? (
                          <CheckSquare size={17} />
                        ) : (
                          <Square size={17} />
                        )}

                        {allVisibleSelected
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
                          No active students were found in this class.
                        </p>
                      )}

                    {!loadingStudents &&
                      visibleStudents.length > 0 && (
                        <div className="grid gap-3 md:grid-cols-2">
                          {visibleStudents.map((student) => {
                            const selected =
                              selectedStudentIds.includes(student.id);

                            return (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() =>
                                  toggleStudent(student.id)
                                }
                                className={`flex items-center justify-between rounded-xl border p-4 text-left ${
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

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleGenerateEntireClass}
                    disabled={
                      submitting ||
                      students.length === 0 ||
                      !selectedTerm
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-600 px-5 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  >
                    <UsersRound size={17} />
                    Generate for Entire Class
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      selectedStudentIds.length === 0 ||
                      !selectedTerm
                    }
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submitting
                      ? "Generating..."
                      : `Generate for Selected (${selectedStudentIds.length})`}
                  </button>
                </div>
              </form>
            )}
          </SectionCard>

          <SectionCard title="Generated Result PINs">
            <div className="mb-4 flex max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
              <Search size={16} className="text-slate-400" />

              <input
                value={pinSearch}
                onChange={(event) =>
                  setPinSearch(event.target.value)
                }
                placeholder="Search student, term, or PIN..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">
                Loading PINs...
              </p>
            ) : filteredPins.length === 0 ? (
              <p className="text-sm text-slate-500">
                No result PINs found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Term</th>
                      <th className="px-4 py-3">PIN</th>
                      <th className="px-4 py-3">Usage</th>
                      <th className="px-4 py-3">Remaining</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPins.map((pin) => (
                      <tr
                        key={pin.id}
                        className="border-b border-slate-100"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {pin.student_name}
                        </td>

                        <td className="px-4 py-3">
                          {pin.term_name}
                        </td>

                        <td className="px-4 py-3 font-mono text-blue-700">
                          {pin.pin}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {pin.usage_count} / {pin.max_usage}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {pin.remaining_uses}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              pin
                            )}`}
                          >
                            {getStatusLabel(pin)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {new Date(
                            pin.created_at
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}