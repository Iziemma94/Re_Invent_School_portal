"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import StatCard from "@/components/common/StatCard";
import SectionCard from "@/components/common/SectionCard";
import WelcomeHero from "@/components/common/WelcomeHero";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProfileAvatar from "@/components/common/ProfileAvatar";
import {
  getCurrentStudentProfile,
  getCurrentStudentEnrollment,
  getStudentDashboardSummary,
} from "@/services/studentService";
import {
  getStudentResults,
  getStudentNotes,
} from "@/services/academicsService";
import { getStudentFees } from "@/services/financeService";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  CreditCard,
  Key,
} from "lucide-react";

interface StudentProfile {
  id: number;
  user_full_name: string;
  profile_picture?: string | null;
  admission_number: string;
  branch_name?: string;
  section_name?: string;
}

interface Enrollment {
  class_name: string;
  class_arm: string;
  session_name: string;
}

interface DashboardSummary {
  results_count: number;
  notes_count: number;
  outstanding_fees: number;
}

interface ResultItem {
  id: number;
  subject_name: string;
  continuous_assessment: string;
  exam_score: string;
  total_score: number;
  term_name: string;
}

interface NoteItem {
  id: number;
  title: string;
  subject_name: string;
  teacher_name: string;
  file: string;
}

interface FeeItem {
  id: number;
  fee_name: string;
  fee_amount: string;
  total_paid: number;
  balance: number;
  term_name: string;
}

const studentSidebarItems = [
  { label: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
  { label: "Results", href: "/dashboard/student/results", icon: FileText },
  { label: "Notes", href: "/dashboard/student/notes", icon: BookOpen },
  { label: "Fees", href: "/dashboard/student/fees", icon: CreditCard },
  { label: "Check Result", href: "/dashboard/student/check-result", icon: Key },
];

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          profileData,
          enrollmentData,
          summaryData,
          resultsData,
          notesData,
          feesData,
        ] = await Promise.all([
          getCurrentStudentProfile(),
          getCurrentStudentEnrollment(),
          getStudentDashboardSummary(),
          getStudentResults(),
          getStudentNotes(),
          getStudentFees(),
        ]);

        setProfile(profileData);
        setEnrollment(enrollmentData);
        setSummary(summaryData);
        setResults(resultsData);
        setNotes(notesData);
        setFees(feesData);
      } catch (err) {
        console.error(err);
        setError("Failed to load student dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Student"
        heading="Student Dashboard"
        subtext="Your academic space"
        sidebarItems={studentSidebarItems}
      >
        {loading && <p>Loading dashboard...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="space-y-6">
            <WelcomeHero name={profile?.user_full_name} />

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                title="Results Uploaded"
                value={summary?.results_count ?? 0}
                accentClass="bg-blue-600"
              />
              <StatCard
                title="Available Notes"
                value={summary?.notes_count ?? 0}
                accentClass="bg-green-600"
              />
              <StatCard
                title="Outstanding Fees"
                value={summary?.outstanding_fees ?? 0}
                accentClass="bg-red-600"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard title="Profile">
                <div className="flex items-start justify-between gap-6">
                
                {/* LEFT SIDE - TEXT */}
                <div className="space-y-3 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Name:</span>{" "}
                    {profile?.user_full_name || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Admission No:
                    </span>{" "}
                    {profile?.admission_number || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Branch:</span>{" "}
                    {profile?.branch_name || "N/A"}
                  </p>
                  <p>
                  <span className="font-semibold text-slate-900">Section:</span>{" "}
                  {profile?.section_name || "N/A"}
                  </p>
                </div>

                {/* RIGHT SIDE - IMAGE */}
                <ProfileAvatar
                  name={profile?.user_full_name}
                  imageUrl={profile?.profile_picture}
                  size={100}
                />
              </div>
              </SectionCard>

              <SectionCard title="Enrollment">
                <div className="space-y-3 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Class:</span>{" "}
                    {enrollment
                      ? `${enrollment.class_name} ${enrollment.class_arm || ""}`
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Session:</span>{" "}
                    {enrollment?.session_name || "N/A"}
                  </p>
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Recent Results">
              {results.length === 0 ? (
                <p className="text-sm text-slate-500">No results available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">CA</th>
                        <th className="px-4 py-3">Exam</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Term</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.slice(0, 5).map((result) => (
                        <tr key={result.id} className="border-b border-slate-100">
                          <td className="px-4 py-3">{result.subject_name}</td>
                          <td className="px-4 py-3">{result.continuous_assessment}</td>
                          <td className="px-4 py-3">{result.exam_score}</td>
                          <td className="px-4 py-3 font-semibold">{result.total_score}</td>
                          <td className="px-4 py-3">{result.term_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard title="Available Notes">
                {notes.length === 0 ? (
                  <p className="text-sm text-slate-500">No notes available.</p>
                ) : (
                  <ul className="space-y-3">
                    {notes.slice(0, 5).map((note) => (
                      <li
                        key={note.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{note.title}</p>
                          <p className="text-sm text-slate-500">
                            {note.subject_name} • {note.teacher_name}
                          </p>
                        </div>
                        <a
                          href={note.file}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                        >
                          Open
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard title="Fee Summary">
                {fees.length === 0 ? (
                  <p className="text-sm text-slate-500">No fee records available.</p>
                ) : (
                  <ul className="space-y-3">
                    {fees.slice(0, 5).map((fee) => (
                      <li
                        key={fee.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <p className="font-medium text-slate-900">{fee.fee_name}</p>
                        <p className="mt-1 text-sm text-slate-500">{fee.term_name}</p>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-slate-500">Amount</p>
                            <p className="font-semibold">{fee.fee_amount}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Paid</p>
                            <p className="font-semibold">{fee.total_paid}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Balance</p>
                            <p className="font-semibold">{fee.balance}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}