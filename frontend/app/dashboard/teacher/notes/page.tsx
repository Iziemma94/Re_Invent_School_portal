"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import {
  getTeacherAssignments,
  getTerms,
  uploadTeacherNote,
} from "@/services/teacherService";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileText,
  ArrowLeft,
} from "lucide-react";

interface TeacherAssignment {
  id: number;
  teacher_name: string;
  subject_name: string;
  class_name: string;
  class_arm: string;
}

interface TermItem {
  id: number;
  name: string;
}

const teacherSidebarItems = [
  { label: "Dashboard", href: "/dashboard/teacher", icon: LayoutDashboard },
  { label: "Assignments", href: "/dashboard/teacher/assignments", icon: ClipboardList },
  { label: "Upload Notes", href: "/dashboard/teacher/notes", icon: BookOpen },
  { label: "Upload Results", href: "/dashboard/teacher/results", icon: FileText },
];

export default function TeacherNotesPage() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [formData, setFormData] = useState({
    title: "",
    teaching_assignment: "",
    term: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [assignmentsData, termsData] = await Promise.all([
          getTeacherAssignments(),
          getTerms(),
        ]);

        setAssignments(assignmentsData);
        setTerms(termsData);
      } catch (error) {
        console.error(error);
        setMessage("Failed to load form data.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setSubmitting(true);

    try {
      if (!file) {
        setMessage("Please choose a file to upload.");
        setMessageType("error");
        setSubmitting(false);
        return;
      }

      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("teaching_assignment", formData.teaching_assignment);
      payload.append("term", formData.term);
      payload.append("file", file);

      await uploadTeacherNote(payload);

      setMessage("Note uploaded successfully.");
      setMessageType("success");
      setFormData({
        title: "",
        teaching_assignment: "",
        term: "",
      });
      setFile(null);
    } catch (error) {
      console.error(error);
      setMessage("Failed to upload note.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Teacher"
        heading="Upload Notes"
        subtext="Upload lesson notes for your assigned classes"
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

          <SectionCard title="Upload New Note">
            {loading ? (
              <p className="text-sm text-slate-500">Loading form data...</p>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Note Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter note title"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Teaching Assignment
                  </label>
                  <select
                    name="teaching_assignment"
                    value={formData.teaching_assignment}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Select assignment</option>
                    {assignments.map((assignment) => (
                      <option key={assignment.id} value={assignment.id}>
                        {assignment.subject_name} — {assignment.class_name}{" "}
                        {assignment.class_arm || ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Term
                  </label>
                  <select
                    name="term"
                    value={formData.term}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
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
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Upload File
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Uploading..." : "Upload Note"}
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
            )}
          </SectionCard>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}