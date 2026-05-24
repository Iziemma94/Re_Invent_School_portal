"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import { getStudentNotes } from "@/services/academicsService";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  CreditCard,
  Search,
  ExternalLink,
  Key,
} from "lucide-react";

interface NoteItem {
  id: number;
  title: string;
  subject_name: string;
  teacher_name: string;
  file: string;
}

const studentSidebarItems = [
  { label: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
  { label: "Results", href: "/dashboard/student/results", icon: FileText },
  { label: "Notes", href: "/dashboard/student/notes", icon: BookOpen },
  { label: "Fees", href: "/dashboard/student/fees", icon: CreditCard },
  { label: "Check Result", href: "/dashboard/student/check-result", icon: Key },
];

export default function StudentNotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadNotes() {
      try {
        const data = await getStudentNotes();
        setNotes(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load notes.");
      } finally {
        setLoading(false);
      }
    }

    loadNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const query = search.toLowerCase();
      return (
        note.title.toLowerCase().includes(query) ||
        note.subject_name.toLowerCase().includes(query) ||
        note.teacher_name.toLowerCase().includes(query)
      );
    });
  }, [notes, search]);

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Student"
        heading="My Notes"
        subtext="Access your study materials and classroom notes"
        sidebarItems={studentSidebarItems}
      >
        <div className="space-y-6">
          <SectionCard title="Notes Overview">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Notes</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {notes.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Displayed Notes</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredNotes.length}
                </h3>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Search Notes">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Search by title, subject, or teacher
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g Algebra"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Available Notes">
            {loading && <p className="text-sm text-slate-500">Loading notes...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && filteredNotes.length === 0 && (
              <p className="text-sm text-slate-500">
                No notes found for your search.
              </p>
            )}

            {!loading && !error && filteredNotes.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {note.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {note.subject_name}
                        </p>
                      </div>

                      <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                        <BookOpen size={18} />
                      </div>
                    </div>

                    <p className="mb-4 text-sm text-slate-600">
                      Uploaded by <span className="font-medium">{note.teacher_name}</span>
                    </p>

                    <a
                      href={note.file}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <ExternalLink size={16} />
                      Open Note
                    </a>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}