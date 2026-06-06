"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import {
  getTeacherClassTeacherAssignments,
  getClassTeacherAssignmentStudents,
  updateClassTeacherRemark,
  getTerms,
  getReportCardTraits,
  updateReportCardTraits,
} from "@/services/teacherService";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileText,
  MessageSquareText,
  ArrowLeft,
} from "lucide-react";

interface ClassTeacherAssignment {
  id: number;
  school_class: number;
  class_name: string;
  class_arm: string | null;
  branch_name?: string | null;
  section_name?: string | null;
  session: number;
  session_name: string;
  display_name: string;
}

interface TermItem {
  id: number;
  name: string;
}

interface AssignmentStudentItem {
  student_id: number;
  student_name: string;
  admission_number: string;
  report_card_id: number;
  class_teacher_remark: string | null;
  head_teacher_remark: string | null;
  performance_rating: string | null;
  average_score: number;
  times_school_opened?: number | null;
  times_present?: number | null;
  times_absent?: number | null;
  attendance_percentage?: number | null;
  position_in_class?: string | null;
  number_on_roll?: number | null;
  promoted_to?: string | null;
  next_term_begins?: string | null;
  vacation_date?: string | null;
  section_name?: string | null;
}

interface StudentFormState {
  class_teacher_remark: string;
  times_school_opened: string;
  times_present: string;
  times_absent: string;
  attendance_percentage: string;
  position_in_class: string;
  number_on_roll: string;
  promoted_to: string;
  next_term_begins: string;
  vacation_date: string;
}

interface TraitItem {
  id?: number;
  trait_type: "psychomotor" | "affective";
  name: string;
  rating: string;
}

const teacherSidebarItemsBase = [
  { label: "Dashboard", href: "/dashboard/teacher", icon: LayoutDashboard },
  { label: "Assignments", href: "/dashboard/teacher/assignments", icon: ClipboardList },
  { label: "Upload Notes", href: "/dashboard/teacher/notes", icon: BookOpen },
  { label: "Upload Results", href: "/dashboard/teacher/results", icon: FileText },
];

const PSYCHOMOTOR_DEFAULTS = [
  "Handwriting",
  "Verbal Fluency",
  "Games",
  "Sports",
  "Handling Tools",
  "Drawing & Painting",
  "Musical Skills",
];

const AFFECTIVE_DEFAULTS = [
  "Punctuality",
  "Neatness",
  "Politeness",
  "Honesty",
  "Co-operation",
  "Leadership",
  "Helping Others",
  "Emotional Stability",
  "Health",
  "Attitude to School Work",
  "Attentiveness",
  "Perseverance",
];

export default function TeacherClassTeacherRemarksPage() {
  const [assignments, setAssignments] = useState<ClassTeacherAssignment[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [students, setStudents] = useState<AssignmentStudentItem[]>([]);
  const [formState, setFormState] = useState<Record<number, StudentFormState>>({});
  const [traitsState, setTraitsState] = useState<Record<number, TraitItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savingTraitsId, setSavingTraitsId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      try {
        setError("");

        const [assignmentsData, termsData] = await Promise.all([
          getTeacherClassTeacherAssignments(),
          getTerms(),
        ]);

        const resolvedAssignments = Array.isArray(assignmentsData) ? assignmentsData : [];
        const resolvedTerms = Array.isArray(termsData) ? termsData : [];

        setAssignments(resolvedAssignments);
        setTerms(resolvedTerms);

        if (resolvedAssignments.length > 0) {
          setSelectedAssignmentId(String(resolvedAssignments[0].id));
        }

        if (resolvedTerms.length > 0) {
          setSelectedTermId(String(resolvedTerms[0].id));
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load class teacher remark data.");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadStudents() {
      if (!selectedAssignmentId || !selectedTermId || assignments.length === 0) return;

      try {
        setLoadingStudents(true);
        setError("");
        setSuccess("");

        const data = await getClassTeacherAssignmentStudents(
          Number(selectedAssignmentId),
          Number(selectedTermId)
        );

        const studentRows: AssignmentStudentItem[] = Array.isArray(data.students)
          ? data.students
          : [];

        setStudents(studentRows);

        const nextFormState: Record<number, StudentFormState> = {};
        const nextTraitsState: Record<number, TraitItem[]> = {};

        for (const student of studentRows) {
          nextFormState[student.report_card_id] = {
            class_teacher_remark: student.class_teacher_remark || "",
            times_school_opened: student.times_school_opened != null ? String(student.times_school_opened) : "",
            times_present: student.times_present != null ? String(student.times_present) : "",
            times_absent: student.times_absent != null ? String(student.times_absent) : "",
            attendance_percentage:
              student.attendance_percentage != null ? String(student.attendance_percentage) : "",
            position_in_class: student.position_in_class || "",
            number_on_roll: student.number_on_roll != null ? String(student.number_on_roll) : "",
            promoted_to: student.promoted_to || "",
            next_term_begins: student.next_term_begins || "",
            vacation_date: student.vacation_date || "",
          };

          const isPrimaryLike = !String(student.section_name || "")
            .toLowerCase()
            .includes("secondary");

          if (isPrimaryLike) {
            try {
              const traits = await getReportCardTraits(student.report_card_id);
              nextTraitsState[student.report_card_id] = buildMergedTraits(
                Array.isArray(traits) ? traits : []
              );
            } catch (traitErr) {
              console.error("Failed to load traits for report card:", student.report_card_id, traitErr);
              nextTraitsState[student.report_card_id] = buildMergedTraits([]);
            }
          }
        }

        setFormState(nextFormState);
        setTraitsState(nextTraitsState);
      } catch (err) {
        console.error(err);
        setError("Failed to load students for the selected class and term.");
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudents();
  }, [selectedAssignmentId, selectedTermId, assignments]);

  const teacherSidebarItems = useMemo(() => {
    const items = [...teacherSidebarItemsBase];
    if (assignments.length > 0) {
      items.push({
        label: "Class Teacher Remarks",
        href: "/dashboard/teacher/class-teacher-remarks",
        icon: MessageSquareText,
      });
    }
    return items;
  }, [assignments]);

  function buildMergedTraits(existing: TraitItem[]): TraitItem[] {
    const existingMap = new Map(
      existing.map((item) => [`${item.trait_type}:${item.name}`, item])
    );

    const merged: TraitItem[] = [];

    for (const name of PSYCHOMOTOR_DEFAULTS) {
      const key = `psychomotor:${name}`;
      const found = existingMap.get(key);
      merged.push({
        id: found?.id,
        trait_type: "psychomotor",
        name,
        rating: found?.rating || "",
      });
    }

    for (const name of AFFECTIVE_DEFAULTS) {
      const key = `affective:${name}`;
      const found = existingMap.get(key);
      merged.push({
        id: found?.id,
        trait_type: "affective",
        name,
        rating: found?.rating || "",
      });
    }

    return merged;
  }

  function computeAttendanceFields(timesOpened: string, timesPresent: string) {
    const opened = Number(timesOpened);
    const present = Number(timesPresent);

    if (
      timesOpened === "" ||
      timesPresent === "" ||
      Number.isNaN(opened) ||
      Number.isNaN(present) ||
      opened <= 0 ||
      present < 0
    ) {
      return {
        times_absent: "",
        attendance_percentage: "",
      };
    }

    const safePresent = Math.min(present, opened);
    const absent = Math.max(opened - safePresent, 0);
    const attendancePercentage = ((safePresent / opened) * 100).toFixed(2);

    return {
      times_absent: String(absent),
      attendance_percentage: attendancePercentage,
    };
  }

  function handleFieldChange(
    reportCardId: number,
    field: keyof StudentFormState,
    value: string
  ) {
    setFormState((prev) => {
      const current = prev[reportCardId];

      if (!current) return prev;

      const updated: StudentFormState = {
        ...current,
        [field]: value,
      };

      if (field === "times_school_opened" || field === "times_present") {
        const calculated = computeAttendanceFields(
          field === "times_school_opened" ? value : updated.times_school_opened,
          field === "times_present" ? value : updated.times_present
        );

        updated.times_absent = calculated.times_absent;
        updated.attendance_percentage = calculated.attendance_percentage;
      }

      return {
        ...prev,
        [reportCardId]: updated,
      };
    });
  }

  function handleTraitChange(
    reportCardId: number,
    traitType: "psychomotor" | "affective",
    traitName: string,
    value: string
  ) {
    setTraitsState((prev) => {
      const current = prev[reportCardId] || [];
      const updated = current.map((item) =>
        item.trait_type === traitType && item.name === traitName
          ? { ...item, rating: value }
          : item
      );

      return {
        ...prev,
        [reportCardId]: updated,
      };
    });
  }

  async function handleSave(reportCardId: number) {
    try {
      setSavingId(reportCardId);
      setError("");
      setSuccess("");

      const current = formState[reportCardId];

      await updateClassTeacherRemark(reportCardId, {
        class_teacher_remark: current.class_teacher_remark,
        times_school_opened: current.times_school_opened,
        times_present: current.times_present,
        times_absent: current.times_absent,
        attendance_percentage: current.attendance_percentage,
        position_in_class: current.position_in_class,
        number_on_roll: current.number_on_roll,
        promoted_to: current.promoted_to,
        next_term_begins: current.next_term_begins,
        vacation_date: current.vacation_date,
      });

      setSuccess("Class teacher report card details saved successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to save class teacher details.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleSaveTraits(reportCardId: number) {
    try {
      setSavingTraitsId(reportCardId);
      setError("");
      setSuccess("");

      await updateReportCardTraits(reportCardId, {
        traits: traitsState[reportCardId] || [],
      });

      setSuccess("Traits saved successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to save traits.");
    } finally {
      setSavingTraitsId(null);
    }
  }

  function isPrimaryStudent(student: AssignmentStudentItem) {
    return !String(student.section_name || "").toLowerCase().includes("secondary");
  }

  function renderTraitsBlock(student: AssignmentStudentItem) {
    const reportCardId = student.report_card_id;
    const traits = traitsState[reportCardId] || [];

    const psychomotor = traits.filter((item) => item.trait_type === "psychomotor");
    const affective = traits.filter((item) => item.trait_type === "affective");

    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Primary / Nursery Traits</h4>
          <p className="mt-1 text-xs text-slate-500">
            Traits are only editable for primary and nursery students.
          </p>
        </div>

        <div className="space-y-6">
          <SectionCard title="Navigation">
            <div className="flex items-center justify-between gap-4">
              <Link
              href="/dashboard/teacher"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <h5 className="mb-3 text-sm font-semibold text-slate-800">Psychomotor</h5>
            <div className="space-y-3">
              {psychomotor.map((trait) => (
                <div
                  key={`${trait.trait_type}-${trait.name}`}
                  className="grid grid-cols-[1fr_110px] items-center gap-3"
                >
                  <label className="text-sm text-slate-700">{trait.name}</label>
                  <input
                    type="text"
                    value={trait.rating}
                    onChange={(e) =>
                      handleTraitChange(reportCardId, trait.trait_type, trait.name, e.target.value)
                    }
                    placeholder="e.g. 4 or A"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h5 className="mb-3 text-sm font-semibold text-slate-800">Affective</h5>
            <div className="space-y-3">
              {affective.map((trait) => (
                <div
                  key={`${trait.trait_type}-${trait.name}`}
                  className="grid grid-cols-[1fr_110px] items-center gap-3"
                >
                  <label className="text-sm text-slate-700">{trait.name}</label>
                  <input
                    type="text"
                    value={trait.rating}
                    onChange={(e) =>
                      handleTraitChange(reportCardId, trait.trait_type, trait.name, e.target.value)
                    }
                    placeholder="e.g. 4 or A"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => handleSaveTraits(reportCardId)}
            disabled={savingTraitsId === reportCardId}
            className="inline-flex min-w-[150px] items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingTraitsId === reportCardId ? "Saving..." : "Save Traits"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Teacher"
        heading="Class Teacher Report Card Entry"
        subtext="Manage class teacher remarks, attendance, promotion details, and primary traits"
        sidebarItems={teacherSidebarItems}
      >
        {loading && <p>Loading class teacher page...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        {!loading && assignments.length === 0 && (
          <SectionCard title="Class Teacher Report Cards">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                No class teacher assignment yet
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                You have not been assigned as a class teacher by the admin, so this section is not available to you right now.
              </p>
            </div>
          </SectionCard>
        )}

        {!loading && assignments.length > 0 && (
          <div className="space-y-6">
            <SectionCard title="Select Class and Term">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Class Teacher Assignment
                  </label>
                  <select
                    value={selectedAssignmentId}
                    onChange={(e) => setSelectedAssignmentId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Select assignment</option>
                    {assignments.map((assignment) => (
                      <option key={assignment.id} value={assignment.id}>
                        {assignment.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Term
                  </label>
                  <select
                    value={selectedTermId}
                    onChange={(e) => setSelectedTermId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
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
            </SectionCard>

            <SectionCard title="Students">
              {loadingStudents ? (
                <p className="text-sm text-slate-500">Loading students...</p>
              ) : students.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No students found for the selected class and term.
                </p>
              ) : (
                <div className="space-y-5">
                  {students.map((student) => {
                    const reportCardId = student.report_card_id;
                    const current = formState[reportCardId];

                    return (
                      <div
                        key={reportCardId}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">
                              {student.student_name}
                            </h3>
                            <p className="text-sm text-slate-500">
                              Admission No: {student.admission_number}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Section: {student.section_name || "-"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
                            Average Score:{" "}
                            <span className="font-semibold text-slate-900">
                              {student.average_score}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Class Teacher Remark
                            </label>
                            <textarea
                              rows={4}
                              value={current?.class_teacher_remark || ""}
                              onChange={(e) =>
                                handleFieldChange(reportCardId, "class_teacher_remark", e.target.value)
                              }
                              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                              placeholder="Write class teacher remark here..."
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Times School Opened
                              </label>
                              <input
                                type="number"
                                value={current?.times_school_opened || ""}
                                onChange={(e) =>
                                  handleFieldChange(reportCardId, "times_school_opened", e.target.value)
                                }
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Times Present
                              </label>
                              <input
                                type="number"
                                value={current?.times_present || ""}
                                onChange={(e) =>
                                  handleFieldChange(reportCardId, "times_present", e.target.value)
                                }
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Times Absent
                              </label>
                              <input
                                type="text"
                                value={current?.times_absent || ""}
                                readOnly
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Attendance Percentage
                              </label>
                              <input
                                type="text"
                                value={current?.attendance_percentage || ""}
                                readOnly
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Position in Class
                              </label>
                              <input
                                type="text"
                                value={current?.position_in_class || ""}
                                onChange={(e) =>
                                  handleFieldChange(reportCardId, "position_in_class", e.target.value)
                                }
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Number on Roll
                              </label>
                              <input
                                type="number"
                                value={current?.number_on_roll || ""}
                                onChange={(e) =>
                                  handleFieldChange(reportCardId, "number_on_roll", e.target.value)
                                }
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Promoted To
                              </label>
                              <input
                                type="text"
                                value={current?.promoted_to || ""}
                                onChange={(e) =>
                                  handleFieldChange(reportCardId, "promoted_to", e.target.value)
                                }
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Next Term Begins
                              </label>
                              <input
                                type="date"
                                value={current?.next_term_begins || ""}
                                onChange={(e) =>
                                  handleFieldChange(reportCardId, "next_term_begins", e.target.value)
                                }
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Vacation Date
                              </label>
                              <input
                                type="date"
                                value={current?.vacation_date || ""}
                                onChange={(e) =>
                                  handleFieldChange(reportCardId, "vacation_date", e.target.value)
                                }
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>

                          {student.head_teacher_remark && (
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Head Teacher Remark
                              </p>
                              <p className="mt-2 text-sm text-slate-700">
                                {student.head_teacher_remark}
                              </p>
                              {student.performance_rating && (
                                <p className="mt-2 text-sm text-slate-600">
                                  <span className="font-semibold text-slate-800">
                                    Performance Rating:
                                  </span>{" "}
                                  {student.performance_rating}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-slate-500">
                              Save class teacher details for this student.
                            </p>

                            <button
                              type="button"
                              onClick={() => handleSave(reportCardId)}
                              disabled={savingId === reportCardId}
                              className="inline-flex min-w-[170px] items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingId === reportCardId ? "Saving..." : "Save Details"}
                            </button>
                          </div>

                          {isPrimaryStudent(student) && renderTraitsBlock(student)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}