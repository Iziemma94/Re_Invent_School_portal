"use client";

import { useState } from "react";
import { LucideIcon } from "lucide-react";
import DashboardNavbar from "./DashboardNavbar";
import DashboardSidebar from "./DashboardSidebar";
import MobileSidebar from "./MobileSidebar";
import MobileTopBar from "./MobileTopBar";

interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  title: string;
  heading: string;
  subtext?: string;
  sidebarItems: SidebarItem[];
  children: React.ReactNode;
}

export default function DashboardLayout({
  title,
  heading,
  subtext,
  sidebarItems,
  children,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardSidebar title={title} items={sidebarItems} />

      <MobileSidebar
        title={title}
        items={sidebarItems}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="min-h-screen p-4 xl:ml-[280px] xl:p-6">
        <div className="mx-auto w-full max-w-7xl">
          <MobileTopBar title={title} onOpenSidebar={() => setMobileOpen(true)} />
          <DashboardNavbar heading={heading} subtext={subtext} />
          {children}
        </div>
      </main>
    </div>
  );
}