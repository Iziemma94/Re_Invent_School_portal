"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface DashboardSidebarProps {
  title: string;
  items: SidebarItem[];
}

export default function DashboardSidebar({
  title,
  items,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] border-r border-slate-800 bg-slate-900 text-white xl:flex xl:flex-col">
      <div className="border-b border-slate-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="overflow-hidden rounded-xl bg-white p-1">
            <Image
              src="/school-logo.jpeg"
              alt="School Logo"
              width={44}
              height={44}
              className="h-11 w-11 object-cover rounded-lg"
              priority
            />
          </div>

          <div>
            <h2 className="text-lg font-bold tracking-wide">Re-Invent Schools</h2>
            <p className="mt-1 text-sm text-slate-400">{title} Portal</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <nav className="space-y-2">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
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

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-2xl bg-slate-800 p-4">
          <p className="text-sm font-semibold text-white">Quick Tip</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Check your latest results, notes, and fees from the menu.
          </p>
        </div>
      </div>
    </aside>
  );
}