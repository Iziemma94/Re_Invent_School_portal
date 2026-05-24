"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import {
  getAdminReportCards,
  updateAdminHeadTeacherRemark,
  getTerms,
  getAcademicSessions,
  getSchoolClasses,
} from "@/services/adminService";

interface TermItem {
  id: number;
  name: string;
}

interface SessionItem {
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

interface ReportCardItem {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  term_id: number;
  term_name: string;
  class_teacher_remark?: string | null;
  head_teacher_remark?: string | null;
  performance_rating?: string | null;
  times_school_opened?: number | null;
  times_present?: number | null;
  times_absent?: number | null;
  attendance_percentage?: number | null;
  position_in_class?: string | null;
  number_on_roll?: number | null;
  promoted_to?: string | null;
  next_term_begins?: string | null;
  vacation_date?: string | null;
}

interface ReportCardFormState {
  head_teacher_remark: string;
  performance_rating: string;
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

export default function AdminHeadTeacherRemarksPage() {
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [classes, setClasses] = useState<SchoolClassItem[]>([]);
  const [reportCards, setReportCards] = useState<ReportCardItem[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const [formState, setFormState] = useState<Record<number, ReportCardFormState>>({});

  useEffect(() => {
    async function loadMeta() {
      try {
        const [termData, sessionData, classData] = await Promise.all([
          getTerms(),
          getAcademicSessions(),
          getSchoolClasses(),
        ]);

        const resolvedTerms = Array.isArray(termData) ? termData : [];
        const resolvedSessions = Array.isArray(sessionData) ? sessionData : [];
        const resolvedClasses = Array.isArray(classData) ? classData : [];

        setTerms(resolvedTerms);
        setSessions(resolvedSessions);
        setClasses(resolvedClasses);

        if (resolvedTerms.length > 0) {
          setSelectedTerm(String(resolvedTerms[0].id));
        }

        if (resolvedSessions.length > 0) {
          setSelectedSession(String(resolvedSessions[0].id));
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load filters.");
      } finally {
        setLoading(false);
      }
    }

    loadMeta();
  }, []);

  useEffect(() => {
    async function loadReportCards() {
      if (!selectedTerm || !selectedSession) return;

      try {
        setLoadingCards(true);
        setError("");
        setSuccess("");

        const data = await getAdminReportCards({
          term: selectedTerm,
          session: selectedSession,
          class: selectedClass || undefined,
        });

        const rows: ReportCardItem[] = Array.isArray(data) ? data : [];
        setReportCards(rows);

        const nextState: Record<number, ReportCardFormState> = {};
        for (const item of rows) {
          nextState[item.id] = {
            head_teacher_remark: item.head_teacher_remark || "",
            performance_rating: item.performance_rating || "",
          };
        }
        setFormState(nextState);
      } catch (err) {
        console.error(err);
        setError("Failed to load report cards.");
      } finally {
        setLoadingCards(false);
      }
    }

    loadReportCards();
  }, [selectedTerm, selectedSession, selectedClass]);

  function handleFieldChange(
    reportCardId: number,
    field: keyof ReportCardFormState,
    value: string
  ) {
    setFormState((prev) => ({
      ...prev,
      [reportCardId]: {
        ...prev[reportCardId],
        [field]: value,
      },
    }));
  }

  async function handleSave(reportCardId: number) {
    try {
      setSavingId(reportCardId);
      setError("");
      setSuccess("");

      await updateAdminHeadTeacherRemark(reportCardId, formState[reportCardId]);

      setSuccess("Head teacher remark saved successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to save head teacher remark.");
    } finally {
      setSavingId(null);
    }
  }

  const classOptions = useMemo(() => {
    return classes.map((item) => ({
      id: item.id,
      label: `${item.name}${item.arm ? ` ${item.arm}` : ""}${item.section_name ? ` - ${item.section_name}` : ""}${item.branch_name ? ` - ${item.branch_name}` : ""}`,
    }));
  }, [classes]);

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin"
        heading="Head Teacher Remarks"
        subtext="Review class teacher entries and add final head teacher remarks"
        sidebarItems={adminSidebarItems}
      >
        {loading && <p>Loading page...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        {!loading && (
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

            <SectionCard title="Filter Report Cards">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Term</label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">Select term</option>
                    {terms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Session</label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">All classes</option>
                    {classOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Report Cards">
              {loadingCards ? (
                <p className="text-sm text-slate-500">Loading report cards...</p>
              ) : reportCards.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No report cards found for the selected filters.
                </p>
              ) : (
                <div className="space-y-5">
                  {reportCards.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {item.student_name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Admission No: {item.admission_number} • {item.term_name}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Times School Opened
                            </p>
                            <p className="mt-2 text-sm text-slate-700">
                              {item.times_school_opened ?? "-"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Times Present
                            </p>
                            <p className="mt-2 text-sm text-slate-700">
                              {item.times_present ?? "-"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Times Absent
                            </p>
                            <p className="mt-2 text-sm text-slate-700">
                              {item.times_absent ?? "-"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Attendance %
                            </p>
                            <p className="mt-2 text-sm text-slate-700">
                              {item.attendance_percentage ?? "-"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Position in Class
                            </p>
                            <p className="mt-2 text-sm text-slate-700">
                              {item.position_in_class || "-"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Number on Roll
                            </p>
                            <p className="mt-2 text-sm text-slate-700">
                              {item.number_on_roll ?? "-"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Promoted To
                            </p>
                            <p className="mt-2 text-sm text-slate-700">
                              {item.promoted_to || "-"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Next Term Begins
                            </p>
                            <p className="mt-2 text-sm text-slate-700">
                              {item.next_term_begins || "-"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Vacation Date
                            </p>
                            <p className="mt-2 text-sm text-slate-700">
                              {item.vacation_date || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Class Teacher Remark
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            {item.class_teacher_remark || "No class teacher remark yet."}
                          </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Head Teacher Remark
                            </label>
                            <textarea
                              rows={4}
                              value={formState[item.id]?.head_teacher_remark || ""}
                              onChange={(e) =>
                                handleFieldChange(item.id, "head_teacher_remark", e.target.value)
                              }
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                              placeholder="Write final head teacher remark..."
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Performance Rating
                            </label>
                            <input
                              type="text"
                              value={formState[item.id]?.performance_rating || ""}
                              onChange={(e) =>
                                handleFieldChange(item.id, "performance_rating", e.target.value)
                              }
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                              placeholder="e.g. Excellent"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSave(item.id)}
                            disabled={savingId === item.id}
                            className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingId === item.id ? "Saving..." : "Save Head Teacher Remark"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}