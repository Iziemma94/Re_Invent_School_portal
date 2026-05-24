"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import StatCard from "@/components/common/StatCard";
import WelcomeHero from "@/components/common/WelcomeHero";
import ProfileAvatar from "@/components/common/ProfileAvatar";
import {
  getCurrentTeacherProfile,
  getTeacherAssignments,
  getTeacherClassTeacherAssignments,
} from "@/services/teacherService";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileText,
  Users,
  MessageSquareText,
} from "lucide-react";

interface TeacherProfile {
  id: number;
  user_full_name?: string;
  username?: string;
  profile_picture?: string | null;
  staff_id: string;
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

export default function TeacherDashboardPage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [classTeacherAssignments, setClassTeacherAssignments] = useState<ClassTeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeacherDashboard() {
      try {
        setError("");

        const [profileResult, assignmentsResult, classTeacherAssignmentsResult] =
          await Promise.allSettled([
            getCurrentTeacherProfile(),
            getTeacherAssignments(),
            getTeacherClassTeacherAssignments(),
          ]);

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value);
          console.log("Teacher profile loaded:", profileResult.value);
        } else {
          console.error("Teacher profile failed:", profileResult.reason);
        }

        if (assignmentsResult.status === "fulfilled") {
          setAssignments(Array.isArray(assignmentsResult.value) ? assignmentsResult.value : []);
        } else {
          console.error("Teacher assignments failed:", assignmentsResult.reason);
        }

        if (classTeacherAssignmentsResult.status === "fulfilled") {
          setClassTeacherAssignments(
            Array.isArray(classTeacherAssignmentsResult.value)
              ? classTeacherAssignmentsResult.value
              : []
          );
        } else {
          console.error(
            "Teacher class teacher assignments failed:",
            classTeacherAssignmentsResult.reason
          );
          setClassTeacherAssignments([]);
        }

        if (
          profileResult.status === "rejected" &&
          assignmentsResult.status === "rejected" &&
          classTeacherAssignmentsResult.status === "rejected"
        ) {
          setError("Failed to load teacher dashboard data.");
        }
      } catch (err) {
        console.error("Unexpected teacher dashboard error:", err);
        setError("Failed to load teacher dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadTeacherDashboard();
  }, []);

  const uniqueSubjects = useMemo(() => {
    return new Set(assignments.map((a) => a.subject_name)).size;
  }, [assignments]);

  const uniqueClasses = useMemo(() => {
    return new Set(assignments.map((a) => `${a.class_name}-${a.class_arm}`)).size;
  }, [assignments]);

  const classTeacherClassesCount = useMemo(() => {
    return classTeacherAssignments.length;
  }, [classTeacherAssignments]);

  const teacherSidebarItems = useMemo(() => {
    const baseItems = [
      { label: "Dashboard", href: "/dashboard/teacher", icon: LayoutDashboard },
      { label: "Assignments", href: "/dashboard/teacher/assignments", icon: ClipboardList },
      { label: "Upload Notes", href: "/dashboard/teacher/notes", icon: BookOpen },
      { label: "Upload Results", href: "/dashboard/teacher/results", icon: FileText },
    ];

    if (classTeacherAssignments.length > 0) {
      baseItems.push({
        label: "Class Teacher Remarks",
        href: "/dashboard/teacher/class-teacher-remarks",
        icon: MessageSquareText,
      });
    }

    return baseItems;
  }, [classTeacherAssignments]);

  const displayName = profile?.user_full_name?.trim() || "Teacher";

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Teacher"
        heading="Teacher Dashboard"
        subtext="Manage your classes, notes, and results"
        sidebarItems={teacherSidebarItems}
      >
        {loading && <p>Loading dashboard...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="space-y-6">
            <WelcomeHero
              name={displayName}
              fallbackLabel="Teacher"
              subtitle="Manage your assigned subjects, upload notes and results, and handle class teacher duties when assigned."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Assignments"
                value={assignments.length}
                accentClass="bg-blue-600"
              />
              <StatCard
                title="Subjects"
                value={uniqueSubjects}
                accentClass="bg-green-600"
              />
              <StatCard
                title="Classes"
                value={uniqueClasses}
                accentClass="bg-purple-600"
              />
              <StatCard
                title="Class Teacher Roles"
                value={classTeacherClassesCount}
                accentClass="bg-amber-600"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard title="Profile">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-4 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-900">Name:</span>{" "}
                      {profile?.user_full_name || "N/A"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-900">Staff ID:</span>{" "}
                      {profile?.staff_id || "N/A"}
                    </p>

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

                  <ProfileAvatar
                    name={displayName}
                    imageUrl={profile?.profile_picture}
                    size={100}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Teacher Summary">
                <div className="space-y-3 text-sm text-slate-700">
                  <p className="flex items-center gap-2">
                    <Users size={16} className="text-slate-500" />
                    You can only work with classes assigned to you.
                  </p>
                  <p className="flex items-center gap-2">
                    <BookOpen size={16} className="text-slate-500" />
                    Upload notes for your assigned subjects only.
                  </p>
                  <p className="flex items-center gap-2">
                    <FileText size={16} className="text-slate-500" />
                    Upload results only for your own teaching assignments.
                  </p>

                  {classTeacherAssignments.length > 0 ? (
                    <p className="flex items-center gap-2 text-amber-700">
                      <MessageSquareText size={16} className="text-amber-600" />
                      You are assigned as class teacher for {classTeacherAssignments.length} class
                      {classTeacherAssignments.length > 1 ? "es" : ""}.
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      You do not currently have any class teacher assignment.
                    </p>
                  )}
                </div>
              </SectionCard>
            </div>

            {classTeacherAssignments.length > 0 && (
              <SectionCard title="My Class Teacher Assignments">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                        <th className="px-4 py-3">Class</th>
                        <th className="px-4 py-3">Arm</th>
                        <th className="px-4 py-3">Section</th>
                        <th className="px-4 py-3">Branch</th>
                        <th className="px-4 py-3">Session</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classTeacherAssignments.map((assignment) => (
                        <tr key={assignment.id} className="border-b border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {assignment.class_name}
                          </td>
                          <td className="px-4 py-3">{assignment.class_arm || "-"}</td>
                          <td className="px-4 py-3">{assignment.section_name || "-"}</td>
                          <td className="px-4 py-3">{assignment.branch_name || "-"}</td>
                          <td className="px-4 py-3">{assignment.session_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            <SectionCard title="My Teaching Assignments">
              {assignments.length === 0 ? (
                <p className="text-sm text-slate-500">No assignments available.</p>
              ) : (
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
                      {assignments.map((assignment) => (
                        <tr key={assignment.id} className="border-b border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {assignment.subject_name}
                          </td>
                          <td className="px-4 py-3">{assignment.class_name}</td>
                          <td className="px-4 py-3">{assignment.class_arm || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}