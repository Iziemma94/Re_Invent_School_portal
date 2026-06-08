import api from "@/lib/axios";

export async function getStudentResults() {
  const response = await api.get("/academics/student/results/");
  return response.data;
}

export async function getStudentNotes() {
  const response = await api.get("/academics/student/notes/");
  return response.data;
}

export async function getStudentReportCards() {
  const response = await api.get("/academics/student/report-cards/");
  return response.data;
}

export async function downloadStudentReportCardPdf(reportCardId: number) {
  const response = await api.get(
    `/academics/student/report-card/pdf/${reportCardId}/`,
    {
      responseType: "blob",
    }
  );

  return response.data;
}

export async function getStudentReportCardTraits(reportCardId: number) {
  const response = await api.get(
    `/academics/student/report-cards/${reportCardId}/traits/`
  );
  return response.data;
}