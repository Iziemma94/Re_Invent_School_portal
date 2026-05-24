import api from "@/lib/axios";

export async function getStudentFees() {
  const response = await api.get("/finance/student/fees/");
  return response.data;
}