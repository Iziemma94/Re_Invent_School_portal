"use client";

import Link from "next/link";
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
  Wallet,
  HandCoins,
  Receipt,
  BarChart3,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

const adminSidebarItems = [
  { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Students", href: "/dashboard/admin/students", icon: GraduationCap },
  { label: "Teachers", href: "/dashboard/admin/teachers", icon: Users },
  { label: "Academics", href: "/dashboard/admin/academics", icon: BookOpen },
  { label: "Finance", href: "/dashboard/admin/finance", icon: CreditCard },
  { label: "Result PINs", href: "/dashboard/admin/pins", icon: KeyRound },
  { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

const financeModules = [
  {
    title: "Fee Structures",
    description:
      "Create and manage class-based fee structures for each branch, section, class, and term.",
    href: "/dashboard/admin/finance/fee-structures",
    icon: Wallet,
  },
  {
    title: "Assign Fees",
    description:
      "Assign created fee structures to individual students and manage their fee records.",
    href: "/dashboard/admin/finance/student-fees",
    icon: HandCoins,
  },
  {
    title: "Record Payments",
    description:
      "Record student payments against assigned fees and track payment references.",
    href: "/dashboard/admin/finance/payments",
    icon: Receipt,
  },
  {
    title: "Finance Summary",
    description:
      "View total billed, total paid, and outstanding balances across student fee records.",
    href: "/dashboard/admin/finance/summary",
    icon: BarChart3,
  },
];

export default function AdminFinanceLandingPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin"
        heading="Finance Management"
        subtext="Manage fee structures, student fee assignments, and payments"
        sidebarItems={adminSidebarItems}
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

          <SectionCard title="Finance Modules">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {financeModules.map((module) => {
                const Icon = module.icon;

                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl bg-slate-100 p-3">
                        <Icon size={20} className="text-slate-700" />
                      </div>
                      <h3 className="font-semibold text-slate-900">
                        {module.title}
                      </h3>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                      {module.description}
                    </p>

                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      Open
                      <ArrowRight size={16} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}