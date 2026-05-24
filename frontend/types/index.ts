// Types will make the frontend easier to maintain and safer to refactor
export type UserRole = "admin" | "teacher" | "student";

export interface CurrentUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone_number: string;
  profile_picture: string | null;
}

export interface StudentDashboardSummary {
  results_count: number;
  notes_count: number;
  outstanding_fees: number;
}