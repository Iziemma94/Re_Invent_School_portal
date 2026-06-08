"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  getCurrentStudentProfile,
  getCurrentStudentEnrollment,
} from "@/services/studentService";
import {
  getStudentReportCards,
  getStudentResults,
  downloadStudentReportCardPdf,
  getStudentReportCardTraits,
} from "@/services/academicsService";
import { ArrowLeft, Download, Printer, Star, Award } from "lucide-react";

interface StudentProfile {
  id: number;
  user_full_name: string;
  admission_number: string;
  branch_name?: string | null;
  section_name?: string | null;
}

interface Enrollment {
  class_name: string;
  class_arm: string;
  session_name: string;
}

interface ResultItem {
  id: number;
  subject_name: string;
  continuous_assessment: string;
  exam_score: string;
  total_score: number;
  term_name: string;
}

interface ReportCardItem {
  id: number;
  term: number;
  term_name: string;
  class_teacher_remark: string | null;
  head_teacher_remark: string | null;
  performance_rating: string | null;
  generated_at: string;
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

interface TraitItem {
  id?: number;
  trait_type: "psychomotor" | "affective";
  name: string;
  rating: string;
}

function getGrade(total: number) {
  if (total >= 75) return "A";
  if (total >= 65) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "F";
}

function getGradeClass(total: number) {
  if (total >= 75) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (total >= 65) return "text-blue-700 bg-blue-50 border-blue-200";
  if (total >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
  if (total >= 40) return "text-orange-700 bg-orange-50 border-orange-200";
  return "text-red-700 bg-red-50 border-red-200";
}

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

function StudentReportCardPreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifiedTermName = searchParams.get("term") || "All";

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [reportCards, setReportCards] = useState<ReportCardItem[]>([]);
  const [traits, setTraits] = useState<TraitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    async function loadReportCardData() {
      try {
        const [profileData, enrollmentData, resultsData, reportCardData] =
          await Promise.all([
            getCurrentStudentProfile(),
            getCurrentStudentEnrollment(),
            getStudentResults(),
            getStudentReportCards(),
          ]);

        setProfile(profileData);
        setEnrollment(enrollmentData);
        setResults(resultsData);
        setReportCards(reportCardData);
      } catch (err) {
        console.error(err);
        setError("Failed to load report card preview.");
      } finally {
        setLoading(false);
      }
    }

    loadReportCardData();
  }, []);

  const filteredResults = useMemo(() => {
    if (!verifiedTermName || verifiedTermName === "All") return results;
    return results.filter((r) => r.term_name === verifiedTermName);
  }, [results, verifiedTermName]);

  const selectedReportCard = useMemo(() => {
    if (!verifiedTermName || verifiedTermName === "All") {
      return reportCards[0] || null;
    }
    return reportCards.find((r) => r.term_name === verifiedTermName) || null;
  }, [reportCards, verifiedTermName]);

  useEffect(() => {
    async function loadTraits() {
      if (!selectedReportCard) {
        setTraits([]);
        return;
      }

      const secondary = String(profile?.section_name || "")
        .toLowerCase()
        .includes("secondary");

      if (secondary) {
        setTraits([]);
        return;
      }

      try {
        const data = await getStudentReportCardTraits(selectedReportCard.id);
        setTraits(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setTraits([]);
      }
    }

    loadTraits();
  }, [selectedReportCard, profile]);

  const averageScore = useMemo(() => {
    if (filteredResults.length === 0) return "0.00";
    const total = filteredResults.reduce((sum, item) => sum + item.total_score, 0);
    return (total / filteredResults.length).toFixed(2);
  }, [filteredResults]);

  const isSecondary = useMemo(() => {
    return String(profile?.section_name || "").toLowerCase().includes("secondary");
  }, [profile]);

  const groupedTraits = useMemo(() => {
    const psychomotorMap = new Map<string, string>();
    const affectiveMap = new Map<string, string>();

    for (const item of traits) {
      if (item.trait_type === "psychomotor") {
        psychomotorMap.set(item.name, item.rating || "-");
      } else if (item.trait_type === "affective") {
        affectiveMap.set(item.name, item.rating || "-");
      }
    }

    return {
      psychomotor: PSYCHOMOTOR_DEFAULTS.map((name) => ({
        name,
        rating: psychomotorMap.get(name) || "-",
      })),
      affective: AFFECTIVE_DEFAULTS.map((name) => ({
        name,
        rating: affectiveMap.get(name) || "-",
      })),
    };
  }, [traits]);

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPdf() {
  try {
    setDownloadingPdf(true);
    setError("");

    function normalizeTerm(value: string) {
      return value.toLowerCase().replace(" term", "").trim();
    }

    const selectedReportCard = reportCards.find((item) => {
      return normalizeTerm(item.term_name) === normalizeTerm(verifiedTermName);
    });

    if (!selectedReportCard) {
      console.log("verifiedTermName:", verifiedTermName);
      console.log("reportCards:", reportCards);
      setError("Could not find the selected report card.");
      return;
    }

    const blob = await downloadStudentReportCardPdf(selectedReportCard.id);
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `report-card-${verifiedTermName
      .replace(/\s+/g, "-")
      .toLowerCase()}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    setError("Failed to download PDF.");
  } finally {
    setDownloadingPdf(false);
  }
}

  function handleBack() {
    router.push("/dashboard/student/check-result");
  }

  function renderSecondaryHeader() {
    return (
      <div className="overflow-hidden rounded-[28px] border border-slate-200">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 px-6 py-6 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
                <Image
                  src="/school-logo.jpeg"
                  alt="School Logo"
                  width={72}
                  height={72}
                  className="h-auto w-auto object-contain"
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-100">
                  Official School Report
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
                  Re-Invent Schools
                </h1>
                <p className="mt-1 text-sm text-blue-100">
                  Student Report Card Preview
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
                  {selectedReportCard?.term_name || verifiedTermName || "N/A"}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-blue-100">
                  Performance Rating
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {selectedReportCard?.performance_rating || "Not available"}
                </p>
              </div>

              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-blue-100">
                  Average Score
                </p>
                <p className="mt-1 text-xl font-bold text-white">{averageScore}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs uppercase tracking-wide text-slate-500">Student</p>
              <p className="mt-1 font-semibold text-slate-900">
                {profile?.user_full_name || "N/A"}
              </p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs uppercase tracking-wide text-slate-500">Admission No</p>
              <p className="mt-1 font-semibold text-slate-900">
                {profile?.admission_number || "N/A"}
              </p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs uppercase tracking-wide text-slate-500">Class</p>
              <p className="mt-1 font-semibold text-slate-900">
                {enrollment
                  ? `${enrollment.class_name} ${enrollment.class_arm || ""}`
                  : "N/A"}
              </p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs uppercase tracking-wide text-slate-500">Session</p>
              <p className="mt-1 font-semibold text-slate-900">
                {enrollment?.session_name || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderPrimaryHeader() {
    return (
      <div className="overflow-hidden rounded-[28px] border border-slate-200">
        <div
          className="px-6 py-6 text-white"
          style={{
            background:
              "linear-gradient(90deg, #db2777 0%, #f59e0b 50%, #10b981 100%)",
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
                <Image
                  src="/school-logo.jpeg"
                  alt="School Logo"
                  width={72}
                  height={72}
                  className="h-auto w-auto object-contain"
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/90">
                  Primary / Nursery Report
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  Re-Invent Schools
                </h1>
                <p className="mt-1 text-sm text-white/90">
                  Student Report Card Preview
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white">
                  {selectedReportCard?.term_name || verifiedTermName || "N/A"}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/20 bg-white/20 px-4 py-3 text-white shadow-sm backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-white/80">
                  Performance Rating
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {selectedReportCard?.performance_rating || "Not available"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/20 px-4 py-3 text-white shadow-sm backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-white/80">
                  Average Score
                </p>
                <p className="mt-1 text-xl font-bold text-white">{averageScore}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-amber-50/40 px-6 py-4">
          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs uppercase tracking-wide text-slate-500">Student</p>
              <p className="mt-1 font-semibold text-slate-900">
                {profile?.user_full_name || "N/A"}
              </p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs uppercase tracking-wide text-slate-500">Admission No</p>
              <p className="mt-1 font-semibold text-slate-900">
                {profile?.admission_number || "N/A"}
              </p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs uppercase tracking-wide text-slate-500">Class</p>
              <p className="mt-1 font-semibold text-slate-900">
                {enrollment
                  ? `${enrollment.class_name} ${enrollment.class_arm || ""}`
                  : "N/A"}
              </p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs uppercase tracking-wide text-slate-500">Session</p>
              <p className="mt-1 font-semibold text-slate-900">
                {enrollment?.session_name || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderSecondaryResultsTable() {
    return (
      <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-900">
              <th className="px-5 py-4 text-left font-semibold text-white">Subject</th>
              <th className="px-5 py-4 text-left font-semibold text-white">CA</th>
              <th className="px-5 py-4 text-left font-semibold text-white">Exam</th>
              <th className="px-5 py-4 text-left font-semibold text-white">Total</th>
              <th className="px-5 py-4 text-left font-semibold text-white">Grade</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result, index) => (
              <tr key={result.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="px-5 py-4 font-medium text-slate-900">{result.subject_name}</td>
                <td className="px-5 py-4 text-slate-700">{result.continuous_assessment}</td>
                <td className="px-5 py-4 text-slate-700">{result.exam_score}</td>
                <td className="px-5 py-4 font-semibold text-slate-900">{result.total_score}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getGradeClass(
                      result.total_score
                    )}`}
                  >
                    {getGrade(result.total_score)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderPrimaryResultsTable() {
    return (
      <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr
              style={{
                background: "linear-gradient(90deg, #db2777 0%, #f59e0b 100%)",
              }}
            >
              <th className="px-5 py-4 text-left font-semibold text-white">Subject</th>
              <th className="px-5 py-4 text-left font-semibold text-white">CA</th>
              <th className="px-5 py-4 text-left font-semibold text-white">Exam</th>
              <th className="px-5 py-4 text-left font-semibold text-white">Total</th>
              <th className="px-5 py-4 text-left font-semibold text-white">Grade</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result, index) => (
              <tr key={result.id} className={index % 2 === 0 ? "bg-white" : "bg-amber-50/30"}>
                <td className="px-5 py-4 font-medium text-slate-900">{result.subject_name}</td>
                <td className="px-5 py-4 text-slate-700">{result.continuous_assessment}</td>
                <td className="px-5 py-4 text-slate-700">{result.exam_score}</td>
                <td className="px-5 py-4 font-semibold text-slate-900">{result.total_score}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getGradeClass(
                      result.total_score
                    )}`}
                  >
                    {getGrade(result.total_score)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderTraitsPreview() {
    return (
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Star size={18} className="text-pink-600" />
            <h3 className="text-lg font-bold text-slate-900">Psychomotor Skills</h3>
          </div>
          <div className="grid gap-2 text-sm text-slate-700">
            {groupedTraits.psychomotor.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-pink-50/40 px-3 py-2"
              >
                <span>{item.name}</span>
                <span className="font-semibold text-slate-700">{item.rating}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Award size={18} className="text-amber-600" />
            <h3 className="text-lg font-bold text-slate-900">Affective Traits</h3>
          </div>
          <div className="grid gap-2 text-sm text-slate-700">
            {groupedTraits.affective.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-amber-50/40 px-3 py-2"
              >
                <span>{item.name}</span>
                <span className="font-semibold text-slate-700">{item.rating}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderSecondaryPreview() {
    return (
      <div className="paper-sheet rounded-[30px] border border-slate-200 bg-white p-8 shadow-xl">
        {renderSecondaryHeader()}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Student Information
            </h2>
            <div className="space-y-3 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Student Name:</span> {profile?.user_full_name || "N/A"}</p>
              <p><span className="font-semibold text-slate-900">Admission No:</span> {profile?.admission_number || "N/A"}</p>
              <p><span className="font-semibold text-slate-900">Branch:</span> {profile?.branch_name || "N/A"}</p>
              <p><span className="font-semibold text-slate-900">Section:</span> {profile?.section_name || "N/A"}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Academic Summary
            </h2>
            <div className="space-y-3 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Class:</span> {enrollment ? `${enrollment.class_name} ${enrollment.class_arm || ""}` : "N/A"}</p>
              <p><span className="font-semibold text-slate-900">Session:</span> {enrollment?.session_name || "N/A"}</p>
              <p><span className="font-semibold text-slate-900">Term:</span> {selectedReportCard?.term_name || verifiedTermName || "N/A"}</p>
              <p><span className="font-semibold text-slate-900">Average Score:</span> {averageScore}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Subject Performance</h2>
              <p className="mt-1 text-sm text-slate-500">Academic breakdown for the selected term</p>
            </div>

            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              Total Subjects: {filteredResults.length}
            </div>
          </div>

          {renderSecondaryResultsTable()}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="mb-3 text-lg font-bold text-slate-900">Class Teacher Remark</h3>
            <p className="text-sm leading-7 text-slate-700">
              {selectedReportCard?.class_teacher_remark || "No remark available."}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="mb-3 text-lg font-bold text-slate-900">Head Teacher Remark</h3>
            <p className="text-sm leading-7 text-slate-700">
              {selectedReportCard?.head_teacher_remark || "No remark available."}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6">
            <div className="mb-12 h-px w-32 bg-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Class Teacher Signature</p>
          </div>

          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6">
            <div className="mb-12 h-px w-32 bg-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Head Teacher Signature</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Grading Key</h3>
          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2 md:grid-cols-5">
            <p><span className="font-semibold">A:</span> 75 - 100</p>
            <p><span className="font-semibold">B:</span> 65 - 74</p>
            <p><span className="font-semibold">C:</span> 50 - 64</p>
            <p><span className="font-semibold">D:</span> 40 - 49</p>
            <p><span className="font-semibold">F:</span> 0 - 39</p>
          </div>
        </div>
      </div>
    );
  }

  function renderPrimaryPreview() {
    return (
      <div className="paper-sheet rounded-[30px] border border-slate-200 bg-white p-8 shadow-xl">
        {renderPrimaryHeader()}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-pink-50/40 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Student Information
            </h2>
            <div className="space-y-3 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Student Name:</span> {profile?.user_full_name || "N/A"}</p>
              <p><span className="font-semibold text-slate-900">Admission No:</span> {profile?.admission_number || "N/A"}</p>
              <p><span className="font-semibold text-slate-900">Branch:</span> {profile?.branch_name || "N/A"}</p>
              <p><span className="font-semibold text-slate-900">Section:</span> {profile?.section_name || "N/A"}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-amber-50/40 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Attendance & Summary
            </h2>
            <div className="space-y-3 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Class:</span> {enrollment ? `${enrollment.class_name} ${enrollment.class_arm || ""}` : "N/A"}</p>
              <p><span className="font-semibold text-slate-900">Session:</span> {enrollment?.session_name || "N/A"}</p>
              <p><span className="font-semibold text-slate-900">Term:</span> {selectedReportCard?.term_name || verifiedTermName || "N/A"}</p>
              <p><span className="font-semibold text-slate-900">Average Score:</span> {averageScore}</p>
              <p><span className="font-semibold text-slate-900">Attendance %:</span> {selectedReportCard?.attendance_percentage ?? "-"}</p>
              <p><span className="font-semibold text-slate-900">Promotion:</span> {selectedReportCard?.promoted_to || "-"}</p>
              <p><span className="font-semibold text-slate-900">Position:</span> {selectedReportCard?.position_in_class || "-"}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Subject Performance</h2>
              <p className="mt-1 text-sm text-slate-500">Academic breakdown for the selected term</p>
            </div>

            <div className="rounded-full bg-pink-100 px-4 py-2 text-sm font-medium text-pink-700">
              Total Subjects: {filteredResults.length}
            </div>
          </div>

          {renderPrimaryResultsTable()}
        </div>

        {renderTraitsPreview()}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-pink-50/40 p-6">
            <h3 className="mb-3 text-lg font-bold text-slate-900">Class Teacher Remark</h3>
            <p className="text-sm leading-7 text-slate-700">
              {selectedReportCard?.class_teacher_remark || "No remark available."}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-emerald-50/40 p-6">
            <h3 className="mb-3 text-lg font-bold text-slate-900">Head Teacher Remark</h3>
            <p className="text-sm leading-7 text-slate-700">
              {selectedReportCard?.head_teacher_remark || "No remark available."}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-dashed border-pink-300 bg-white p-6">
            <div className="mb-12 h-px w-32 bg-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Class Teacher Signature</p>
          </div>

          <div className="rounded-3xl border border-dashed border-emerald-300 bg-white p-6">
            <div className="mb-12 h-px w-32 bg-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Head Teacher Signature</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-amber-50/40 p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Grading Key</h3>
          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2 md:grid-cols-5">
            <p><span className="font-semibold">A:</span> 75 - 100</p>
            <p><span className="font-semibold">B:</span> 65 - 74</p>
            <p><span className="font-semibold">C:</span> 50 - 64</p>
            <p><span className="font-semibold">D:</span> 40 - 49</p>
            <p><span className="font-semibold">F:</span> 0 - 39</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <>
        <style jsx global>{`
          @media print {
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            .no-print {
              display: none !important;
            }

            .print-shell {
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }

            .paper-sheet {
              box-shadow: none !important;
              border-radius: 0 !important;
              border: 0 !important;
            }
          }
        `}</style>

        <div className="print-shell min-h-screen bg-slate-100 px-4 py-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <div className="no-print flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download size={16} />
                  {downloadingPdf ? "Preparing..." : "Download PDF"}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                >
                  <Printer size={16} />
                  Print / Save as PDF
                </button>
              </div>
            </div>

            {loading && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Loading report card preview...</p>
              </div>
            )}

            {error && (
              <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                {isSecondary ? renderSecondaryPreview() : renderPrimaryPreview()}
              </>
            )}
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}

export default function StudentReportCardPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 px-4 py-8">
          <div className="mx-auto w-full max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Loading report card preview...</p>
          </div>
        </div>
      }
    >
      <StudentReportCardPreviewContent />
    </Suspense>
  );
}