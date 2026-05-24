"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import {
  getAdminStudents,
  getTerms,
  getAdminResultPins,
  createAdminResultPin,
} from "@/services/adminService";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  Settings,
  KeyRound,
} from "lucide-react";

interface StudentItem {
  id: number;
  student_name: string;
  admission_number: string;
  branch_name?: string | null;
  section_name?: string | null;
}

interface TermItem {
  id: number;
  name: string;
}

interface ResultPinItem {
  id: number;
  student_name: string;
  term_name: string;
  pin: string;
  usage_count: number;
  max_usage: number;
  remaining_uses: number;
  is_used_up: boolean;
  created_at: string;
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

export default function AdminPinsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [pins, setPins] = useState<ResultPinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [formData, setFormData] = useState({
    student: "",
    term: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [studentsData, termsData, pinsData] = await Promise.all([
          getAdminStudents(),
          getTerms(),
          getAdminResultPins(),
        ]);

        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setTerms(Array.isArray(termsData) ? termsData : []);
        setPins(Array.isArray(pinsData) ? pinsData : []);
      } catch (error) {
        console.error(error);
        setMessage("Failed to load result PIN data.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setSubmitting(true);

    try {
      const response = await createAdminResultPin(formData);

      if (response?.pin) {
        setMessage(response.detail || "Existing PIN found for this student and term.");
      } else {
        setMessage("Result PIN generated successfully.");
      }

      setMessageType("success");

      const pinsData = await getAdminResultPins();
      setPins(Array.isArray(pinsData) ? pinsData : []);

      setFormData({
        student: "",
        term: "",
      });
    } catch (error) {
      console.error(error);
      setMessage("Failed to generate result PIN.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusLabel(pin: ResultPinItem) {
    if (pin.is_used_up) return "Used Up";
    if (pin.usage_count > 0) return "Partially Used";
    return "Unused";
  }

  function getStatusClass(pin: ResultPinItem) {
    if (pin.is_used_up) return "bg-red-100 text-red-700";
    if (pin.usage_count > 0) return "bg-amber-100 text-amber-700";
    return "bg-green-100 text-green-700";
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin"
        heading="Result PIN Management"
        subtext="Generate and manage student result access PINs"
        sidebarItems={adminSidebarItems}
      >
        <div className="space-y-6">
          <SectionCard title="Generate Result PIN">
            {loading ? (
              <p className="text-sm text-slate-500">Loading form data...</p>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Student
                  </label>
                  <select
                    name="student"
                    value={formData.student}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Select student</option>
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Generating..." : "Generate PIN"}
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

          <SectionCard title="Generated Result PINs">
            {loading ? (
              <p className="text-sm text-slate-500">Loading pins...</p>
            ) : pins.length === 0 ? (
              <p className="text-sm text-slate-500">No result pins generated yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Term</th>
                      <th className="px-4 py-3">PIN</th>
                      <th className="px-4 py-3">Usage</th>
                      <th className="px-4 py-3">Remaining</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pins.map((pin) => (
                      <tr key={pin.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {pin.student_name}
                        </td>
                        <td className="px-4 py-3">{pin.term_name}</td>
                        <td className="px-4 py-3 font-mono text-blue-700">
                          {pin.pin}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {pin.usage_count} / {pin.max_usage}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {pin.remaining_uses}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(pin)}`}
                          >
                            {getStatusLabel(pin)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {new Date(pin.created_at).toLocaleString()}
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