"use client";

import Link from "next/link";
import { X, LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface MobileSidebarProps {
  title: string;
  items: SidebarItem[];
  open: boolean;
  onClose: () => void;
}

export default function MobileSidebar({
  title,
  items,
  open,
  onClose,
}: MobileSidebarProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <aside className="absolute left-0 top-0 h-screen w-[280px] bg-slate-900 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-6">
          <div>
            <h2 className="text-2xl font-bold tracking-wide">{title}</h2>
            <p className="mt-1 text-sm text-slate-400">School Portal</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-6">
          <nav className="space-y-2">
            {items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </div>
  );
}