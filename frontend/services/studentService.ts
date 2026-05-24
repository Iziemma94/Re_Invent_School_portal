import api from "@/lib/axios";

export async function getCurrentStudentProfile() {
  const response = await api.get("/students/me/student-profile/");
  return response.data;
}

export async function getCurrentStudentEnrollment() {
  const response = await api.get("/students/me/enrollment/");
  return response.data;
}

export async function getStudentDashboardSummary() {
  const response = await api.get("/students/student/dashboard/");
  return response.data;
}