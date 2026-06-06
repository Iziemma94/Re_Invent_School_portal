"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import { getStudentResults } from "@/services/academicsService";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  CreditCard,
  Search,
  Key,
  ArrowLeft,
} from "lucide-react";

interface ResultItem {
  id: number;
  subject_name: string;
  continuous_assessment: string;
  exam_score: string;
  total_score: number;
  term_name: string;
}

const studentSidebarItems = [
  { label: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
  { label: "Results", href: "/dashboard/student/results", icon: FileText },
  { label: "Notes", href: "/dashboard/student/notes", icon: BookOpen },
  { label: "Fees", href: "/dashboard/student/fees", icon: CreditCard },
  { label: "Check Result", href: "/dashboard/student/check-result", icon: Key },
];

function getGrade(total: number) {
  if (total >= 75) return "A";
  if (total >= 65) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "F";
}

function getGradeBadgeClass(grade: string) {
  switch (grade) {
    case "A":
      return "bg-green-100 text-green-700";
    case "B":
      return "bg-blue-100 text-blue-700";
    case "C":
      return "bg-yellow-100 text-yellow-700";
    case "D":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-red-100 text-red-700";
  }
}

export default function StudentResultsPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [termFilter, setTermFilter] = useState("All");

  useEffect(() => {
    async function loadResults() {
      try {
        const data = await getStudentResults();
        setResults(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load results.");
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, []);

  const availableTerms = useMemo(() => {
    const uniqueTerms = Array.from(new Set(results.map((r) => r.term_name)));
    return ["All", ...uniqueTerms];
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const matchesSearch = result.subject_name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesTerm =
        termFilter === "All" || result.term_name === termFilter;

      return matchesSearch && matchesTerm;
    });
  }, [results, search, termFilter]);

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Student"
        heading="My Results"
        subtext="View all your academic results"
        sidebarItems={studentSidebarItems}
      >
        <div className="space-y-6">
          <SectionCard title="Navigation">
            <div className="flex items-center justify-between gap-4">
              <Link
              href="/dashboard/student"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>
            </div>
          </SectionCard>
        </div>
        
        <div className="space-y-6">
          <SectionCard title="Results Overview">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Subjects</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {results.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Displayed Results</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredResults.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Best Score</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredResults.length > 0
                    ? Math.max(...filteredResults.map((r) => r.total_score))
                    : 0}
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Filter Results">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search by subject
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g Mathematics"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Filter by term
                </label>
                <select
                  value={termFilter}
                  onChange={(e) => setTermFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                >
                  {availableTerms.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Results Table">
            {loading && <p className="text-sm text-slate-500">Loading results...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && filteredResults.length === 0 && (
              <p className="text-sm text-slate-500">
                No results found for the selected filter.
              </p>
            )}

            {!loading && !error && filteredResults.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">CA</th>
                      <th className="px-4 py-3">Exam</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3">Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result) => {
                      const grade = getGrade(result.total_score);

                      return (
                        <tr
                          key={result.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {result.subject_name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {result.continuous_assessment}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {result.exam_score}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {result.total_score}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getGradeBadgeClass(
                                grade
                              )}`}
                            >
                              {grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {result.term_name}
                          </td>
                        </tr>
                      );
                    })}
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