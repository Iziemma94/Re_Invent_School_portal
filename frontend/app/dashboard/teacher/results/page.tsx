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
  CheckCircle2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Save,
  Search,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";

import {
  getTeacherAssignments,
  getTerms,
  getStudentsForAssignment,
  uploadTeacherResultsBulk,
} from "@/services/teacherService";

interface TeacherAssignment {
  id: number;
  teacher_name: string;
  subject_name: string;
  class_name: string;
  class_arm?: string | null;
}

interface TermItem {
  id: number;
  name: string;
}

interface StudentResultRow {
  id: number;
  student_name: string;
  admission_number?: string | null;
  result_id?: number | null;
  continuous_assessment: string;
  exam_score: string;
  total_score: string;
  has_existing_result: boolean;
}

interface LoadedAssignment {
  id: number;
  subject_name: string;
  class_name: string;
  class_arm?: string | null;
}

interface LoadedTerm {
  id: number;
  name: string;
}

interface ClassResultResponse {
  assignment?: LoadedAssignment;
  term?: LoadedTerm | null;
  students?: StudentResultRow[];
}

interface ApiErrorData {
  detail?: string;
  errors?: Array<{
    row?: number;
    student?: number;
    detail?: string;
  }>;
  [key: string]: unknown;
}

const teacherSidebarItems = [
  {
    label: "Dashboard",
    href: "/dashboard/teacher",
    icon: LayoutDashboard,
  },
  {
    label: "Assignments",
    href: "/dashboard/teacher/assignments",
    icon: ClipboardList,
  },
  {
    label: "Upload Notes",
    href: "/dashboard/teacher/notes",
    icon: BookOpen,
  },
  {
    label: "Upload Results",
    href: "/dashboard/teacher/results",
    icon: FileText,
  },
];

function toNumber(value: string) {
  if (value.trim() === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatScore(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2);
}

export default function TeacherResultsPage() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);

  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  const [loadedAssignment, setLoadedAssignment] =
    useState<LoadedAssignment | null>(null);
  const [loadedTerm, setLoadedTerm] = useState<LoadedTerm | null>(null);

  const [rows, setRows] = useState<StudentResultRow[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingClass, setLoadingClass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  useEffect(() => {
    async function loadInitialData() {
      try {
        setMessage("");
        setMessageType("");

        const [assignmentsData, termsData] = await Promise.all([
          getTeacherAssignments(),
          getTerms(),
        ]);

        setAssignments(
          Array.isArray(assignmentsData) ? assignmentsData : []
        );
        setTerms(Array.isArray(termsData) ? termsData : []);
      } catch (error) {
        console.error(error);
        setMessage("Failed to load assignments and terms.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return (
        row.student_name.toLowerCase().includes(query) ||
        (row.admission_number || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [rows, search]);

  const completedRowsCount = useMemo(() => {
    return rows.filter(
      (row) =>
        row.continuous_assessment.trim() !== "" &&
        row.exam_score.trim() !== ""
    ).length;
  }, [rows]);

  const existingRowsCount = useMemo(() => {
    return rows.filter((row) => row.has_existing_result).length;
  }, [rows]);

  const invalidRowsCount = useMemo(() => {
    return rows.filter((row) => {
      if (
        row.continuous_assessment.trim() === "" &&
        row.exam_score.trim() === ""
      ) {
        return false;
      }

      const ca = toNumber(row.continuous_assessment);
      const exam = toNumber(row.exam_score);

      return (
        ca < 0 ||
        exam < 0 ||
        ca > 40 ||
        exam > 60 ||
        ca + exam > 100
      );
    }).length;
  }, [rows]);

  function clearMessages() {
    setMessage("");
    setMessageType("");
  }

  function resetLoadedResults() {
    setRows([]);
    setLoadedAssignment(null);
    setLoadedTerm(null);
    setSearch("");
    clearMessages();
  }

  function handleAssignmentChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setSelectedAssignment(event.target.value);
    resetLoadedResults();
  }

  function handleTermChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setSelectedTerm(event.target.value);
    resetLoadedResults();
  }

  async function handleLoadClass() {
    clearMessages();

    if (!selectedAssignment) {
      setMessage("Select a teaching assignment.");
      setMessageType("error");
      return;
    }

    if (!selectedTerm) {
      setMessage("Select a term.");
      setMessageType("error");
      return;
    }

    try {
      setLoadingClass(true);

      const response: ClassResultResponse =
        await getStudentsForAssignment(
          selectedAssignment,
          selectedTerm
        );

      const studentRows = Array.isArray(response?.students)
        ? response.students
        : [];

      setLoadedAssignment(response.assignment || null);
      setLoadedTerm(response.term || null);

      setRows(
        studentRows.map((student) => ({
          ...student,
          continuous_assessment:
            student.continuous_assessment ?? "",
          exam_score: student.exam_score ?? "",
          total_score: student.total_score ?? "0",
          has_existing_result:
            Boolean(student.has_existing_result),
        }))
      );

      if (studentRows.length === 0) {
        setMessage(
          "No active students were found in this class."
        );
        setMessageType("error");
      } else {
        setMessage(
          `${studentRows.length} student(s) loaded successfully.`
        );
        setMessageType("success");
      }
    } catch (error) {
      console.error(error);

      const axiosError = error as AxiosError<ApiErrorData>;

      setRows([]);
      setLoadedAssignment(null);
      setLoadedTerm(null);

      setMessage(
        axiosError.response?.data?.detail ||
          "Failed to load students and existing results."
      );
      setMessageType("error");
    } finally {
      setLoadingClass(false);
    }
  }

  function updateScore(
    studentId: number,
    field: "continuous_assessment" | "exam_score",
    value: string
  ) {
    if (value !== "" && !/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }

    setRows((previous) =>
      previous.map((row) => {
        if (row.id !== studentId) {
          return row;
        }

        const updatedRow = {
          ...row,
          [field]: value,
        };

        const ca = toNumber(
          field === "continuous_assessment"
            ? value
            : updatedRow.continuous_assessment
        );

        const exam = toNumber(
          field === "exam_score"
            ? value
            : updatedRow.exam_score
        );

        return {
          ...updatedRow,
          total_score: formatScore(ca + exam),
        };
      })
    );

    clearMessages();
  }

  function getRowError(row: StudentResultRow) {
    const hasCa = row.continuous_assessment.trim() !== "";
    const hasExam = row.exam_score.trim() !== "";

    if (!hasCa && !hasExam) {
      return "";
    }

    if (!hasCa || !hasExam) {
      return "Enter both CA and exam scores.";
    }

    const ca = toNumber(row.continuous_assessment);
    const exam = toNumber(row.exam_score);

    if (ca < 0 || exam < 0) {
      return "Scores cannot be negative.";
    }

    if (ca > 40) {
      return "CA cannot exceed 40.";
    }

    if (exam > 60) {
      return "Exam cannot exceed 60.";
    }

    if (ca + exam > 100) {
      return "Total cannot exceed 100.";
    }

    return "";
  }

  function fillEmptyCaWithZero() {
    setRows((previous) =>
      previous.map((row) => {
        if (row.continuous_assessment.trim() !== "") {
          return row;
        }

        const exam = toNumber(row.exam_score);

        return {
          ...row,
          continuous_assessment: "0",
          total_score: formatScore(exam),
        };
      })
    );
  }

  function fillEmptyExamWithZero() {
    setRows((previous) =>
      previous.map((row) => {
        if (row.exam_score.trim() !== "") {
          return row;
        }

        const ca = toNumber(row.continuous_assessment);

        return {
          ...row,
          exam_score: "0",
          total_score: formatScore(ca),
        };
      })
    );
  }

  function clearAllScores() {
    const confirmed = window.confirm(
      "Clear every score currently entered on this page?"
    );

    if (!confirmed) {
      return;
    }

    setRows((previous) =>
      previous.map((row) => ({
        ...row,
        continuous_assessment: "",
        exam_score: "",
        total_score: "0",
      }))
    );

    clearMessages();
  }

  function getErrorMessage(error: unknown) {
    const axiosError = error as AxiosError<ApiErrorData>;
    const responseData = axiosError.response?.data;

    if (responseData?.errors?.length) {
      const firstError = responseData.errors[0];

      return (
        firstError.detail ||
        responseData.detail ||
        "Some result rows contain invalid data."
      );
    }

    return (
      responseData?.detail ||
      "Failed to save the class results."
    );
  }

  async function handleSaveAll(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    clearMessages();

    if (!selectedAssignment || !selectedTerm) {
      setMessage("Select an assignment and term.");
      setMessageType("error");
      return;
    }

    if (rows.length === 0) {
      setMessage("Load the class before saving results.");
      setMessageType("error");
      return;
    }

    const incompleteRows = rows.filter((row) => {
      const hasCa = row.continuous_assessment.trim() !== "";
      const hasExam = row.exam_score.trim() !== "";

      return hasCa !== hasExam;
    });

    if (incompleteRows.length > 0) {
      setMessage(
        `${incompleteRows.length} student row(s) have only one score entered. Enter both CA and exam scores.`
      );
      setMessageType("error");
      return;
    }

    const rowsToSave = rows.filter(
      (row) =>
        row.continuous_assessment.trim() !== "" &&
        row.exam_score.trim() !== ""
    );

    if (rowsToSave.length === 0) {
      setMessage("Enter scores for at least one student.");
      setMessageType("error");
      return;
    }

    const invalidRows = rowsToSave.filter(
      (row) => getRowError(row) !== ""
    );

    if (invalidRows.length > 0) {
      setMessage(
        `${invalidRows.length} row(s) contain invalid scores. Check the highlighted rows.`
      );
      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);

      const response = await uploadTeacherResultsBulk({
        teaching_assignment: Number(selectedAssignment),
        term: Number(selectedTerm),
        results: rowsToSave.map((row) => ({
          student: row.id,
          continuous_assessment:
            row.continuous_assessment,
          exam_score: row.exam_score,
        })),
      });

      setMessage(
        response.message ||
          `${rowsToSave.length} result(s) saved successfully.`
      );
      setMessageType("success");

      await handleLoadClass();
    } catch (error) {
      console.error(error);
      setMessage(getErrorMessage(error));
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Teacher"
        heading="Class Result Entry"
        subtext="Enter and update results for an entire class"
        sidebarItems={teacherSidebarItems}
      >
        <div className="space-y-6">
          <SectionCard title="Navigation">
            <Link
              href="/dashboard/teacher"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </SectionCard>

          <SectionCard title="Select Class Result Sheet">
            {loading ? (
              <p className="text-sm text-slate-500">
                Loading assignments and terms...
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Teaching Assignment
                  </label>

                  <select
                    value={selectedAssignment}
                    onChange={handleAssignmentChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">
                      Select assignment
                    </option>

                    {assignments.map((assignment) => (
                      <option
                        key={assignment.id}
                        value={assignment.id}
                      >
                        {assignment.subject_name} —{" "}
                        {assignment.class_name}
                        {assignment.class_arm
                          ? ` ${assignment.class_arm}`
                          : ""}
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
                    onChange={handleTermChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Select term</option>

                    {terms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleLoadClass}
                  disabled={
                    loadingClass ||
                    !selectedAssignment ||
                    !selectedTerm
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={17}
                    className={
                      loadingClass ? "animate-spin" : ""
                    }
                  />

                  {loadingClass
                    ? "Loading Class..."
                    : "Load Class"}
                </button>
              </div>
            )}

            {message && (
              <div
                className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${
                  messageType === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}
          </SectionCard>

          {rows.length > 0 && (
            <>
              <SectionCard title="Result Entry Overview">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      Students
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">
                      {rows.length}
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      Completed Rows
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-blue-700">
                      {completedRowsCount}
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      Existing Results
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-green-700">
                      {existingRowsCount}
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      Invalid Rows
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-red-700">
                      {invalidRowsCount}
                    </h3>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title={`${loadedAssignment?.subject_name || "Result"} — ${
                  loadedAssignment?.class_name || ""
                }${
                  loadedAssignment?.class_arm
                    ? ` ${loadedAssignment.class_arm}`
                    : ""
                } — ${loadedTerm?.name || ""}`}
              >
                <form
                  onSubmit={handleSaveAll}
                  className="space-y-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex max-w-md flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
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
                        placeholder="Search student or admission number..."
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={fillEmptyCaWithZero}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Fill Empty CA with 0
                      </button>

                      <button
                        type="button"
                        onClick={fillEmptyExamWithZero}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Fill Empty Exam with 0
                      </button>

                      <button
                        type="button"
                        onClick={clearAllScores}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="min-w-[850px] w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-slate-100">
                        <tr className="border-b border-slate-200 text-left text-slate-600">
                          <th className="w-14 px-4 py-3">
                            S/N
                          </th>
                          <th className="px-4 py-3">
                            Admission No.
                          </th>
                          <th className="min-w-56 px-4 py-3">
                            Student
                          </th>
                          <th className="w-36 px-4 py-3">
                            CA / 40
                          </th>
                          <th className="w-36 px-4 py-3">
                            Exam / 60
                          </th>
                          <th className="w-28 px-4 py-3">
                            Total
                          </th>
                          <th className="w-36 px-4 py-3">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleRows.map((row, index) => {
                          const rowError = getRowError(row);
                          const total = toNumber(
                            row.total_score
                          );

                          return (
                            <tr
                              key={row.id}
                              className={`border-b border-slate-100 ${
                                rowError
                                  ? "bg-red-50"
                                  : row.has_existing_result
                                    ? "bg-green-50/40"
                                    : "bg-white"
                              }`}
                            >
                              <td className="px-4 py-3 text-slate-500">
                                {index + 1}
                              </td>

                              <td className="px-4 py-3 text-slate-700">
                                {row.admission_number || "-"}
                              </td>

                              <td className="px-4 py-3">
                                <p className="font-medium text-slate-900">
                                  {row.student_name}
                                </p>

                                {rowError && (
                                  <p className="mt-1 text-xs text-red-600">
                                    {rowError}
                                  </p>
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  max="40"
                                  step="0.01"
                                  value={
                                    row.continuous_assessment
                                  }
                                  onChange={(event) =>
                                    updateScore(
                                      row.id,
                                      "continuous_assessment",
                                      event.target.value
                                    )
                                  }
                                  className={`w-full rounded-lg border px-3 py-2 text-center outline-none ${
                                    rowError
                                      ? "border-red-300 bg-white focus:border-red-500"
                                      : "border-slate-200 bg-white focus:border-blue-500"
                                  }`}
                                  placeholder="0"
                                />
                              </td>

                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  max="60"
                                  step="0.01"
                                  value={row.exam_score}
                                  onChange={(event) =>
                                    updateScore(
                                      row.id,
                                      "exam_score",
                                      event.target.value
                                    )
                                  }
                                  className={`w-full rounded-lg border px-3 py-2 text-center outline-none ${
                                    rowError
                                      ? "border-red-300 bg-white focus:border-red-500"
                                      : "border-slate-200 bg-white focus:border-blue-500"
                                  }`}
                                  placeholder="0"
                                />
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex min-w-16 justify-center rounded-lg px-3 py-2 font-bold ${
                                    total >= 50
                                      ? "bg-green-100 text-green-700"
                                      : total > 0
                                        ? "bg-red-100 text-red-700"
                                        : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {formatScore(total)}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                {row.has_existing_result ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                    <CheckCircle2 size={14} />
                                    Existing
                                  </span>
                                ) : row.continuous_assessment &&
                                  row.exam_score ? (
                                  <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                    New
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {visibleRows.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No students match your search.
                    </p>
                  )}

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Only rows with both CA and exam scores
                      will be saved.
                    </p>

                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        completedRowsCount === 0 ||
                        invalidRowsCount > 0
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save size={18} />

                      {submitting
                        ? "Saving Results..."
                        : `Save All Results (${completedRowsCount})`}
                    </button>
                  </div>
                </form>
              </SectionCard>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}