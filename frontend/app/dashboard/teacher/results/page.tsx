"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import {
  getTeacherAssignments,
  getTerms,
  getStudentsForAssignment,
  uploadTeacherResult,
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

interface StudentItem {
  id: number;
  student_name: string;
  admission_number: string;
}

const teacherSidebarItems = [
  { label: "Dashboard", href: "/dashboard/teacher", icon: LayoutDashboard },
  { label: "Assignments", href: "/dashboard/teacher/assignments", icon: ClipboardList },
  { label: "Upload Notes", href: "/dashboard/teacher/notes", icon: BookOpen },
  { label: "Upload Results", href: "/dashboard/teacher/results", icon: FileText },
];

export default function TeacherResultsPage() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [formData, setFormData] = useState({
    teaching_assignment: "",
    student: "",
    term: "",
    continuous_assessment: "",
    exam_score: "",
  });

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

  useEffect(() => {
    async function loadStudents() {
      if (!formData.teaching_assignment) {
        setStudents([]);
        setFormData((prev) => ({ ...prev, student: "" }));
        return;
      }

      try {
        setLoadingStudents(true);
        const data = await getStudentsForAssignment(formData.teaching_assignment);
        setStudents(data);
      } catch (error) {
        console.error(error);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudents();
  }, [formData.teaching_assignment]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "teaching_assignment" ? { student: "" } : {}),
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setSubmitting(true);

    try {
      await uploadTeacherResult(formData);

      setMessage("Result uploaded successfully.");
      setMessageType("success");
      setFormData({
        teaching_assignment: "",
        student: "",
        term: "",
        continuous_assessment: "",
        exam_score: "",
      });
      setStudents([]);
    } catch (error) {
      console.error(error);
      setMessage("Failed to upload result.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Teacher"
        heading="Upload Results"
        subtext="Upload results for your assigned classes"
        sidebarItems={teacherSidebarItems}
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
          <SectionCard title="Upload Student Result">
            {loading ? (
              <p className="text-sm text-slate-500">Loading form data...</p>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
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
                    Student
                  </label>
                  <select
                    name="student"
                    value={formData.student}
                    onChange={handleChange}
                    required
                    disabled={!formData.teaching_assignment || loadingStudents}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                  >
                    <option value="">
                      {loadingStudents
                        ? "Loading students..."
                        : "Select student"}
                    </option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.student_name} — {student.admission_number}
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
                    Continuous Assessment
                  </label>
                  <input
                    type="number"
                    name="continuous_assessment"
                    value={formData.continuous_assessment}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                    placeholder="Enter CA score"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Exam Score
                  </label>
                  <input
                    type="number"
                    name="exam_score"
                    value={formData.exam_score}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                    placeholder="Enter exam score"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Uploading..." : "Upload Result"}
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