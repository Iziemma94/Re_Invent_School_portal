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
  School,
  ClipboardList,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  MessageSquareText,
  FileSignature,
} from "lucide-react";
import {
  getTerms,
  getAdminSubjects,
  getAdminAssignments,
  getAdminClassTeacherAssignments,
  getAdminReportCards,
} from "@/services/adminService";

interface TermItem {
  id: number;
  name: string;
}

interface SubjectItem {
  id: number;
  name: string;
  code: string;
}

interface AssignmentItem {
  id: number;
  teacher_name: string;
  subject_name: string;
  subject_code: string;
  class_name: string;
  class_arm: string;
  branch_name?: string | null;
  session_name?: string | null;
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

const academicManagementLinks = [
  {
    title: "Manage Classes",
    description: "Create and update academic classes across branches and sections.",
    href: "/dashboard/admin/academics/classes",
    icon: School,
  },
  {
    title: "Manage Subjects",
    description: "Organize school subjects and keep the curriculum structure clean.",
    href: "/dashboard/admin/academics/subjects",
    icon: ClipboardList,
  },
  {
    title: "Teacher Assignments",
    description: "Assign teachers to classes and subjects for proper academic flow.",
    href: "/dashboard/admin/academics/assignments",
    icon: UserCheck,
  },
  {
    title: "Manage Class-Subject",
    description: "Create assignments cleanly from real class-subject records.",
    href: "/dashboard/admin/academics/class-subjects",
    icon: BookOpen,
  },
  {
    title: "Class Teacher Assignments",
    description: "Assign teachers as class teachers for specific classes and sessions.",
    href: "/dashboard/admin/academics/class-teacher-assignments",
    icon: MessageSquareText,
  },
  {
    title: "Head Teacher Remarks",
    description: "Review class teacher remarks and complete final report card details.",
    href: "/dashboard/admin/academics/head-teacher-remarks",
    icon: FileSignature,
  },
];

export default function AdminAcademicsPage() {
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [classTeacherAssignments, setClassTeacherAssignments] = useState<ClassTeacherAssignmentItem[]>([]);
  const [reportCards, setReportCards] = useState<ReportCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAcademicData() {
      try {
        const [
          termsData,
          subjectsData,
          assignmentsData,
          classTeacherAssignmentsData,
          reportCardsData,
        ] = await Promise.allSettled([
          getTerms(),
          getAdminSubjects(),
          getAdminAssignments(),
          getAdminClassTeacherAssignments(),
          getAdminReportCards(),
        ]);

        if (termsData.status === "fulfilled") {
          setTerms(Array.isArray(termsData.value) ? termsData.value : []);
        }

        if (subjectsData.status === "fulfilled") {
          setSubjects(Array.isArray(subjectsData.value) ? subjectsData.value : []);
        }

        if (assignmentsData.status === "fulfilled") {
          setAssignments(Array.isArray(assignmentsData.value) ? assignmentsData.value : []);
        }

        if (classTeacherAssignmentsData.status === "fulfilled") {
          setClassTeacherAssignments(
            Array.isArray(classTeacherAssignmentsData.value)
              ? classTeacherAssignmentsData.value
              : []
          );
        }

        if (reportCardsData.status === "fulfilled") {
          setReportCards(Array.isArray(reportCardsData.value) ? reportCardsData.value : []);
        }

        const allFailed =
          termsData.status === "rejected" &&
          subjectsData.status === "rejected" &&
          assignmentsData.status === "rejected" &&
          classTeacherAssignmentsData.status === "rejected" &&
          reportCardsData.status === "rejected";

        if (allFailed) {
          setError("Failed to load academic data.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load academic data.");
      } finally {
        setLoading(false);
      }
    }

    loadAcademicData();
  }, []);

  const uniqueTeachers = useMemo(() => {
    return new Set(assignments.map((a) => a.teacher_name)).size;
  }, [assignments]);

  const uniqueClasses = useMemo(() => {
    return new Set(assignments.map((a) => `${a.class_name}-${a.class_arm}`)).size;
  }, [assignments]);

  const reportCardsWithClassTeacherRemarks = useMemo(() => {
    return reportCards.filter((item) => item.class_teacher_remark).length;
  }, [reportCards]);

  const reportCardsWithHeadTeacherRemarks = useMemo(() => {
    return reportCards.filter((item) => item.head_teacher_remark).length;
  }, [reportCards]);

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin"
        heading="Academic Management"
        subtext="Manage the academic structure of the school portal"
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
          <SectionCard title="Academic Management">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {academicManagementLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-3 text-slate-700">
                      <Icon size={20} />
                    </div>

                    <h3 className="text-base font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {item.description}
                    </p>

                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      Open
                      <ArrowRight size={16} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Academic Overview">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Terms</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {terms.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Subjects</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {subjects.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Teachers Assigned</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {uniqueTeachers}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Class Assignments</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {uniqueClasses}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Class Teacher Roles</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {classTeacherAssignments.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Report Cards</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {reportCards.length}
                </h3>
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Remark Workflow Snapshot">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">With Class Teacher Remark</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    {reportCardsWithClassTeacherRemarks}
                  </h3>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">With Head Teacher Remark</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    {reportCardsWithHeadTeacherRemarks}
                  </h3>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Class Teacher Assignments Snapshot">
              {loading ? (
                <p className="text-sm text-slate-500">Loading class teacher assignments...</p>
              ) : classTeacherAssignments.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No class teacher assignments found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                        <th className="px-4 py-3">Teacher</th>
                        <th className="px-4 py-3">Class</th>
                        <th className="px-4 py-3">Branch</th>
                        <th className="px-4 py-3">Session</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classTeacherAssignments.slice(0, 5).map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {item.teacher_name}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Academic Terms">
            {loading ? (
              <p className="text-sm text-slate-500">Loading terms...</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : terms.length === 0 ? (
              <p className="text-sm text-slate-500">No terms found.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {terms.map((term) => (
                  <div
                    key={term.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <p className="font-semibold text-slate-900">{term.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Available term
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Subjects Snapshot">
            {loading ? (
              <p className="text-sm text-slate-500">Loading subjects...</p>
            ) : subjects.length === 0 ? (
              <p className="text-sm text-slate-500">No subjects found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Subject Name</th>
                      <th className="px-4 py-3">Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => (
                      <tr key={subject.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {subject.name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {subject.code || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Teaching Assignments Snapshot">
            {loading ? (
              <p className="text-sm text-slate-500">Loading assignments...</p>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-slate-500">
                No teaching assignments found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Teacher</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Session</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => (
                      <tr key={assignment.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {assignment.teacher_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {assignment.subject_name} ({assignment.subject_code || "-"})
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {assignment.class_name} {assignment.class_arm || ""}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {assignment.branch_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {assignment.session_name || "-"}
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