"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  ArrowLeft,
  Save,
} from "lucide-react";
import {
  getAdminSettings,
  bulkUpdateAdminSettings,
} from "@/services/adminService";

interface SettingItem {
  id: number;
  category: string;
  key: string;
  value: string;
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

const BOOLEAN_KEYS = new Set([
  "result_checking_enabled",
  "notes_download_enabled",
  "show_attendance",
  "show_position",
  "show_primary_traits",
  "allow_part_payment",
  "show_fee_balance_to_students",
]);

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [formState, setFormState] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setError("");
        const data = await getAdminSettings();
        const resolved = Array.isArray(data) ? data : [];
        setSettings(resolved);

        const nextState: Record<number, string> = {};
        for (const item of resolved) {
          nextState[item.id] = item.value ?? "";
        }
        setFormState(nextState);
      } catch (err) {
        console.error(err);
        setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const groupedSettings = useMemo(() => {
    return {
      school: settings.filter((item) => item.category === "school"),
      academic: settings.filter((item) => item.category === "academic"),
      report_card: settings.filter((item) => item.category === "report_card"),
      finance: settings.filter((item) => item.category === "finance"),
    };
  }, [settings]);

  function handleChange(settingId: number, value: string) {
    setFormState((prev) => ({
      ...prev,
      [settingId]: value,
    }));
  }

  function prettifyKey(key: string) {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  async function handleSaveAll() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        settings: settings.map((item) => ({
          id: item.id,
          value: formState[item.id] ?? "",
        })),
      };

      await bulkUpdateAdminSettings(payload);
      setSuccess("Settings saved successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  function renderField(item: SettingItem) {
    const value = formState[item.id] ?? "";

    if (BOOLEAN_KEYS.has(item.key)) {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(item.id, e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
        >
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      );
    }

    if (
      item.key.includes("address") ||
      item.key.includes("note") ||
      item.key.includes("motto")
    ) {
      return (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => handleChange(item.id, e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(item.id, e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
      />
    );
  }

  function renderCategory(title: string, items: SettingItem[]) {
    return (
      <SectionCard title={title}>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No settings found in this category.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {prettifyKey(item.key)}
                </label>
                {renderField(item)}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Admin"
        heading="Admin Settings"
        subtext="Manage school-wide portal settings"
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

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save All Settings"}
              </button>
            </div>
          </SectionCard>

          {loading && (
            <SectionCard title="Loading">
              <p className="text-sm text-slate-500">Loading settings...</p>
            </SectionCard>
          )}

          {error && (
            <SectionCard title="Error">
              <p className="text-sm text-red-600">{error}</p>
            </SectionCard>
          )}

          {success && (
            <SectionCard title="Success">
              <p className="text-sm text-green-600">{success}</p>
            </SectionCard>
          )}

          {!loading && renderCategory("School Settings", groupedSettings.school)}
          {!loading && renderCategory("Academic Settings", groupedSettings.academic)}
          {!loading && renderCategory("Report Card Settings", groupedSettings.report_card)}
          {!loading && renderCategory("Finance Settings", groupedSettings.finance)}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}