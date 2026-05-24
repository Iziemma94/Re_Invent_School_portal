"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import { getStudentFees } from "@/services/financeService";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  CreditCard,
  Search,
  Key,
} from "lucide-react";

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

function getPaymentStatus(balance: number) {
  if (balance <= 0) return "Paid";
  return "Outstanding";
}

function getStatusClass(status: string) {
  return status === "Paid"
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700";
}

export default function StudentFeesPage() {
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [termFilter, setTermFilter] = useState("All");

  useEffect(() => {
    async function loadFees() {
      try {
        const data = await getStudentFees();
        setFees(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load fee records.");
      } finally {
        setLoading(false);
      }
    }

    loadFees();
  }, []);

  const availableTerms = useMemo(() => {
    const uniqueTerms = Array.from(new Set(fees.map((f) => f.term_name)));
    return ["All", ...uniqueTerms];
  }, [fees]);

  const filteredFees = useMemo(() => {
    return fees.filter((fee) => {
      const matchesSearch = fee.fee_name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesTerm =
        termFilter === "All" || fee.term_name === termFilter;

      return matchesSearch && matchesTerm;
    });
  }, [fees, search, termFilter]);

  const totalAmount = filteredFees.reduce(
    (sum, fee) => sum + Number(fee.fee_amount),
    0
  );

  const totalPaid = filteredFees.reduce(
    (sum, fee) => sum + Number(fee.total_paid),
    0
  );

  const totalBalance = filteredFees.reduce(
    (sum, fee) => sum + Number(fee.balance),
    0
  );

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Student"
        heading="My Fees"
        subtext="Track your fees, payments, and outstanding balances"
        sidebarItems={studentSidebarItems}
      >
        <div className="space-y-6">
          <SectionCard title="Fee Overview">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Fee Amount</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {totalAmount}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Paid</p>
                <h3 className="mt-2 text-2xl font-bold text-green-700">
                  {totalPaid}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Outstanding Balance</p>
                <h3 className="mt-2 text-2xl font-bold text-red-700">
                  {totalBalance}
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Filter Fees">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search by fee item
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g Tuition"
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

          <SectionCard title="Fee Records">
            {loading && (
              <p className="text-sm text-slate-500">Loading fee records...</p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && filteredFees.length === 0 && (
              <p className="text-sm text-slate-500">
                No fee records found for the selected filter.
              </p>
            )}

            {!loading && !error && filteredFees.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-4 py-3">Fee Item</th>
                      <th className="px-4 py-3">Term</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Balance</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFees.map((fee) => {
                      const status = getPaymentStatus(Number(fee.balance));

                      return (
                        <tr
                          key={fee.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {fee.fee_name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {fee.term_name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {fee.fee_amount}
                          </td>
                          <td className="px-4 py-3 text-green-700 font-medium">
                            {fee.total_paid}
                          </td>
                          <td className="px-4 py-3 text-red-700 font-medium">
                            {fee.balance}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                status
                              )}`}
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