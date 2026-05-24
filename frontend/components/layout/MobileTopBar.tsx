"use client";

import { Menu } from "lucide-react";

interface MobileTopBarProps {
  title: string;
  onOpenSidebar: () => void;
}

export default function MobileTopBar({
  title,
  onOpenSidebar,
}: MobileTopBarProps) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm xl:hidden">
      <button
        onClick={onOpenSidebar}
        className="rounded-lg border border-slate-200 p-2 text-slate-700"
      >
        <Menu size={20} />
      </button>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="w-10" />
    </div>
  );
}