"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import api from "@/lib/axios";
import {
  getCurrentStudentProfile,
  getCurrentStudentEnrollment,
} from "@/services/studentService";
import {
  getStudentReportCards,
  getStudentResults,
} from "@/services/academicsService";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  CreditCard,
  Key,
  Eye,
  ArrowLeft,
} from "lucide-react";

const studentSidebarItems = [
  { label: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
  { label: "Results", href: "/dashboard/student/results", icon: FileText },
  { label: "Notes", href: "/dashboard/student/notes", icon: BookOpen },
  { label: "Fees", href: "/dashboard/student/fees", icon: CreditCard },
  { label: "Check Result", href: "/dashboard/student/check-result", icon: Key },
];

const termOptions = [
  { label: "First Term", value: "1", termName: "First Term" },
  { label: "Second Term", value: "2", termName: "Second Term" },
  { label: "Third Term", value: "3", termName: "Third Term" },
];

export default function CheckResultPage() {
  const [pin, setPin] = useState("");
  const [term, setTerm] = useState("");
  const [verifiedTermName, setVerifiedTermName] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const [loadingReport, setLoadingReport] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function preloadStudentData() {
      try {
        await Promise.all([
          getCurrentStudentProfile(),
          getCurrentStudentEnrollment(),
          getStudentResults(),
          getStudentReportCards(),
        ]);
      } catch (err) {
        console.error("Failed to preload student report data:", err);
      }
    }

    preloadStudentData();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setSubmitting(true);
    setLoadingReport(true);
    setIsVerified(false);
    setVerifiedTermName("");

    try {
      const response = await api.post("/academics/student/verify-pin/", {
        pin,
        term,
      });

      if (response.status === 200) {
        const selectedTerm = termOptions.find((item) => item.value === term);
        const termName = selectedTerm?.termName || "All";

        await Promise.all([
          getCurrentStudentProfile(),
          getCurrentStudentEnrollment(),
          getStudentResults(),
          getStudentReportCards(),
        ]);

        setVerifiedTermName(termName);
        setIsVerified(true);
        setMessage("PIN verified successfully. You can now preview your report card.");
        setMessageType("success");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage(
          error.response?.data?.detail || "Invalid PIN or term selected."
        );
      } else {
        setMessage("Something went wrong. Please try again.");
      }
      setMessageType("error");
      setIsVerified(false);
      setVerifiedTermName("");
    } finally {
      setSubmitting(false);
      setLoadingReport(false);
    }
  }

  function handlePreviewResult() {
    const previewUrl = `/dashboard/student/check-result/preview?term=${encodeURIComponent(
      verifiedTermName
    )}`;
    window.open(previewUrl, "_blank");
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Student"
        heading="Check Result"
        subtext="Enter your result PIN to access your report card"
        sidebarItems={studentSidebarItems}
      >
        <div className="space-y-6">
          <SectionCard title="Navigation">
            <div className="flex items-center justify-between gap-4">
              <Link
              href="/dashboard/sudent"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>
            </div>
          </SectionCard>
        </div>
        
        <div className="space-y-6">
          <SectionCard title="Result PIN Verification">
            <div className="max-w-2xl">
              <p className="mb-6 text-sm text-slate-600">
                Select the term, enter your result PIN, and unlock access to your report card.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Term
                  </label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Select Term</option>
                    {termOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Result PIN
                  </label>
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    placeholder="Enter your result PIN"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Verifying..." : "Verify PIN"}
                </button>

                {message && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm font-medium ${
                      messageType === "success"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {message}
                  </div>
                )}
              </form>
            </div>
          </SectionCard>

          {loadingReport && (
            <p className="text-sm text-slate-500">Loading report card...</p>
          )}

          {isVerified && !loadingReport && (
            <SectionCard title="Report Card Access">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <button
                  type="button"
                  onClick={handlePreviewResult}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Eye size={16} />
                  Preview Result
                </button>
              </div>

              <p className="mt-4 text-sm text-slate-600">
                Verified term: <span className="font-semibold">{verifiedTermName}</span>
              </p>
            </SectionCard>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}