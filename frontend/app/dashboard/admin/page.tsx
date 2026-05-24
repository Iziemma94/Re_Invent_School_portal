"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import StatCard from "@/components/common/StatCard";
import WelcomeHero from "@/components/common/WelcomeHero";
import { getCurrentUser } from "@/services/accountService";
import { getAdminSettings } from "@/services/adminService";
import ProfileAvatar from "@/components/common/ProfileAvatar";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  Settings,
  KeyRound,
} from "lucide-react";

interface AdminUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  profile_picture?: string | null;
}

interface SettingItem {
  id?: number;
  key?: string;
  value?: string;
  category?: string;
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

export default function AdminDashboardPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAdminDashboard() {
      try {
        const [adminData, settingsData] = await Promise.allSettled([
          getCurrentUser(),
          getAdminSettings(),
        ]);

        if (adminData.status === "fulfilled") {
          setAdmin(adminData.value);
        }

        if (settingsData.status === "fulfilled") {
          setSettings(Array.isArray(settingsData.value) ? settingsData.value : []);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load admin dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadAdminDashboard();
  }, []);

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin"
        heading="Admin Dashboard"
        subtext="Manage the school portal from one place"
        sidebarItems={adminSidebarItems}
      >
        {loading && <p>Loading dashboard...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="space-y-6">
            <WelcomeHero name={admin?.full_name || admin?.username || "Admin"} />

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                title="Portal Role"
                value={admin?.role || "admin"}
                accentClass="bg-blue-600"
              />
              <StatCard
                title="Settings Loaded"
                value={settings.length}
                accentClass="bg-green-600"
              />
              <StatCard
                title="System Access"
                value="Full"
                accentClass="bg-purple-600"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard title="Administrator Profile">
                <div className="flex items-start justify-between gap-6">
                
                {/* LEFT SIDE - TEXT */}
                <div className="space-y-3 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Name:</span>{" "}
                    {admin?.full_name || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Username:</span>{" "}
                    {admin?.username || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Email:</span>{" "}
                    {admin?.email || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Role:</span>{" "}
                    {admin?.role || "N/A"}
                  </p>
                </div>

                {/* RIGHT SIDE - IMAGE */}
                <ProfileAvatar
                  name={admin?.full_name || admin?.username}
                  imageUrl={admin?.profile_picture}
                  size={100}
                />
              </div>
              </SectionCard>

              <SectionCard title="System Overview">
                <div className="space-y-3 text-sm text-slate-700">
                  <p>• Manage students across all branches</p>
                  <p>• Register teachers and assign classes/subjects</p>
                  <p>• Control academic sessions, terms, and portal settings</p>
                  <p>• Issue result PINs for student report access</p>
                  <p>• Monitor notes, results, and fee structures</p>
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Quick Management Areas">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <GraduationCap className="text-blue-600" size={20} />
                    <h3 className="font-semibold text-slate-900">Students</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Create and manage student records, branch placement, and class enrollment.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <Users className="text-green-600" size={20} />
                    <h3 className="font-semibold text-slate-900">Teachers</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Register teachers, assign subjects, classes, and restrict them to their branch.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <BookOpen className="text-purple-600" size={20} />
                    <h3 className="font-semibold text-slate-900">Academics</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Manage sessions, terms, class subjects, notes, and student results.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <CreditCard className="text-amber-600" size={20} />
                    <h3 className="font-semibold text-slate-900">Finance</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Manage fee structures, student fee records, and balances.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <KeyRound className="text-rose-600" size={20} />
                    <h3 className="font-semibold text-slate-900">Result PINs</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Generate and manage result access PINs for secure report-card checks.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <Settings className="text-slate-700" size={20} />
                    <h3 className="font-semibold text-slate-900">Settings</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Configure school-wide values, portal options, and general system setup.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Current Portal Settings">
              {settings.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No settings loaded yet, or the settings endpoint is not available.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Key</th>
                        <th className="px-4 py-3">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settings.map((setting, index) => (
                        <tr
                          key={setting.id ?? index}
                          className="border-b border-slate-100"
                        >
                          <td className="px-4 py-3">{setting.category || "-"}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {setting.key || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {setting.value || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}