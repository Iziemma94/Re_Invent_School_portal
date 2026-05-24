import api from "@/lib/axios";

export async function getCurrentTeacherProfile() {
  const response = await api.get("/students/me/teacher-profile/");
  return response.data;
}

export async function getTeacherAssignments() {
  const response = await api.get("/academics/teacher/assignments/");
  return response.data;
}

export async function getTerms() {
  const response = await api.get("/academics/terms/");
  return response.data;
}

export async function uploadTeacherNote(formData: FormData) {
  const response = await api.post("/academics/teacher/notes/upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function getStudentsForAssignment(teachingAssignmentId: string) {
  const response = await api.get(
    `/academics/teacher/assignment-students/?teaching_assignment=${teachingAssignmentId}`
  );
  return response.data;
}

export async function uploadTeacherResult(payload: {
  teaching_assignment: string;
  student: string;
  term: string;
  continuous_assessment: string;
  exam_score: string;
}) {
  const response = await api.post("/academics/teacher/results/upload/", payload);
  return response.data;
}

export async function getTeacherClassTeacherAssignments() {
  const response = await api.get("/academics/teacher/class-teacher-assignments/");
  return response.data;
}

export async function getClassTeacherAssignmentStudents(
  assignmentId: number,
  termId: number
) {
  const response = await api.get(
    `/academics/teacher/class-teacher-assignments/${assignmentId}/students/?term=${termId}`
  );
  return response.data;
}

export async function updateClassTeacherRemark(
  reportCardId: number,
  payload: {
    class_teacher_remark: string;
    times_school_opened?: string | number;
    times_present?: string | number;
    times_absent?: string | number;
    attendance_percentage?: string | number;
    position_in_class?: string;
    number_on_roll?: string | number;
    promoted_to?: string;
    next_term_begins?: string;
    vacation_date?: string;
  }
) {
  const response = await api.put(
    `/academics/teacher/report-cards/${reportCardId}/class-teacher-remark/`,
    payload
  );
  return response.data;
}

export async function getReportCardTraits(reportCardId: number) {
  const response = await api.get(
    `/academics/teacher/report-cards/${reportCardId}/traits/`
  );
  return response.data;
}

export async function updateReportCardTraits(
  reportCardId: number,
  payload: {
    traits: Array<{
      id?: number;
      trait_type: "psychomotor" | "affective";
      name: string;
      rating: string;
    }>;
  }
) {
  const response = await api.put(
    `/academics/teacher/report-cards/${reportCardId}/traits/update/`,
    payload
  );
  return response.data;
}