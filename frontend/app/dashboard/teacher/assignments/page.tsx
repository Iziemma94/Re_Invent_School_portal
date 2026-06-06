"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import { getCurrentTeacherProfile, getTeacherAssignments } from "@/services/teacherService";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileText,
  ArrowLeft,
} from "lucide-react";

interface TeacherProfile {
  id: number;
  user_full_name: string;
  username?: string;
  staff_id: string;
  profile_picture?: string | null;
  branch_names?: string[];
  section_names?: string[];
}

interface TeacherAssignment {
  id: number;
  teacher_name: string;
  subject_name: string;
  class_name: string;
  class_arm: string;
}

const teacherSidebarItems = [
  { label: "Dashboard", href: "/dashboard/teacher", icon: LayoutDashboard },
  { label: "Assignments", href: "/dashboard/teacher/assignments", icon: ClipboardList },
  { label: "Upload Notes", href: "/dashboard/teacher/notes", icon: BookOpen },
  { label: "Upload Results", href: "/dashboard/teacher/results", icon: FileText },
];

export default function TeacherAssignmentsPage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadAssignments() {
      try {
        const [profileData, assignmentsData] = await Promise.all([
          getCurrentTeacherProfile(),
          getTeacherAssignments(),
        ]);

        setProfile(profileData);
        setAssignments(assignmentsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load assignments.");
      } finally {
        setLoading(false);
      }
    }

    loadAssignments();
  }, []);

  const filteredAssignments = useMemo(() => {
    const q = search.toLowerCase();
    return assignments.filter((assignment) => {
      return (
        assignment.subject_name.toLowerCase().includes(q) ||
        assignment.class_name.toLowerCase().includes(q) ||
        (assignment.class_arm || "").toLowerCase().includes(q)
      );
    });
  }, [assignments, search]);

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Teacher"
        heading="My Assignments"
        subtext="View the classes and subjects assigned to you"
        sidebarItems={teacherSidebarItems}
      >
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

          <SectionCard title="Teacher Information">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Name:</span>{" "}
                  {profile?.user_full_name || "N/A"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Staff ID:</span>{" "}
                  {profile?.staff_id || "N/A"}
                </p>
              </div>

              <div className="space-y-4 text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">Branches:</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile?.branch_names?.length ? (
                      profile.branch_names.map((branch, index) => (
                        <span
                          key={`${branch}-${index}`}
                          className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                        >
                          {branch}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">N/A</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-900">Sections:</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile?.section_names?.length ? (
                      profile.section_names.map((section, index) => (
                        <span
                          key={`${section}-${index}`}
                          className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700"
                        >
                          {section}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">N/A</span>
                    )}
                  </div>
                </div>
              </div>
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
                <p className="text-sm text-slate-500">Displayed</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredAssignments.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Unique Subjects</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {new Set(assignments.map((item) => item.subject_name)).size}
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Search Assignments">
            <div className="max-w-md">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Search by subject or class
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g Mathematics or JSS1"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </SectionCard>

          <SectionCard title="Assigned Classes and Subjects">
            {loading && <p className="text-sm text-slate-500">Loading assignments...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && filteredAssignments.length === 0 && (
              <p className="text-sm text-slate-500">No assignments found.</p>
            )}

            {!loading && !error && filteredAssignments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Arm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((assignment) => (
                      <tr key={assignment.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {assignment.subject_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {assignment.class_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {assignment.class_arm || "-"}
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