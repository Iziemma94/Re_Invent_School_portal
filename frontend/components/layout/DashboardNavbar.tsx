"use client";

import LogoutButton from "@/components/common/LogoutButton";

interface DashboardNavbarProps {
  heading: string;
  subtext?: string;
}

export default function DashboardNavbar({
  heading,
  subtext,
}: DashboardNavbarProps) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
          {subtext && <p className="mt-1 text-sm text-slate-500">{subtext}</p>}
          <p className="mt-2 text-xs text-slate-400">{today}</p>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}