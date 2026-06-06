"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
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
  Search,
  ArrowLeft,
} from "lucide-react";
import api from "@/lib/axios";

interface FeeItem {
  id: number;
  student_name: string;
  admission_number: string;
  term_name: string;
  session_name: string;
  fee_name: string;
  class_name: string;
  branch_name: string;
  section_name: string;
  amount_paid: string | number | null;
  total_amount: string | number;
  outstanding: string | number;
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

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

function getStatus(outstanding: number) {
  return outstanding <= 0 ? "Paid" : "Outstanding";
}

export default function AdminFinanceSummaryPage() {
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadFees() {
      try {
        const response = await api.get("/finance/admin/fees/");
        setFees(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load finance summary.");
      } finally {
        setLoading(false);
      }
    }

    loadFees();
  }, []);

  const filteredFees = useMemo(() => {
    const q = search.trim().toLowerCase();

    return fees.filter((fee) => {
      return (
        fee.student_name.toLowerCase().includes(q) ||
        fee.admission_number.toLowerCase().includes(q) ||
        fee.term_name.toLowerCase().includes(q) ||
        fee.fee_name.toLowerCase().includes(q) ||
        fee.class_name.toLowerCase().includes(q) ||
        fee.branch_name.toLowerCase().includes(q) ||
        fee.section_name.toLowerCase().includes(q)
      );
    });
  }, [fees, search]);

  const totalBilled = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + toNumber(fee.total_amount), 0);
  }, [filteredFees]);

  const totalPaid = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + toNumber(fee.amount_paid), 0);
  }, [filteredFees]);

  const totalOutstanding = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + toNumber(fee.outstanding), 0);
  }, [filteredFees]);

  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin"
        heading="Finance Summary"
        subtext="Monitor billed amounts, payments, and outstanding balances"
        sidebarItems={adminSidebarItems}
      >
        <div className="space-y-6">
          <SectionCard title="Navigation">
            <div className="flex items-center justify-between">
              <Link
                href="/dashboard/admin/finance"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back to Finance
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Finance Overview">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Fee Records</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredFees.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Billed</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {totalBilled}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Paid</p>
                <h3 className="mt-2 text-2xl font-bold text-green-700">
                  {totalPaid}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Outstanding</p>
                <h3 className="mt-2 text-2xl font-bold text-red-700">
                  {totalOutstanding}
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Search Finance Records">
            <div className="max-w-md">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Search by student, admission number, fee item, class, branch, section, or term
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search finance records..."
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Finance Summary Records">
            {loading && (
              <p className="text-sm text-slate-500">Loading finance summary...</p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && filteredFees.length === 0 && (
              <p className="text-sm text-slate-500">No finance records found.</p>
            )}

            {!loading && !error && filteredFees.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Admission No</th>
                      <th className="px-4 py-3">Fee Item</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Section</th>
                      <th className="px-4 py-3">Term</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Outstanding</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFees.map((fee) => {
                      const outstanding = toNumber(fee.outstanding);
                      const status = getStatus(outstanding);

                      return (
                        <tr key={fee.id} className="border-b border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {fee.student_name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {fee.admission_number}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {fee.fee_name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {fee.class_name || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {fee.branch_name || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {fee.section_name || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {fee.term_name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {fee.total_amount}
                          </td>
                          <td className="px-4 py-3 font-medium text-green-700">
                            {fee.amount_paid ?? 0}
                          </td>
                          <td className="px-4 py-3 font-medium text-red-700">
                            {fee.outstanding}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                status === "Paid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {status}
                            </span>
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