import api from "@/lib/axios";

/* =========================
   SETTINGS
========================= */
export async function getAdminSettings() {
  const response = await api.get("/settings/");
  return response.data;
}

export async function updateAdminSetting(
  settingId: number,
  payload: { value: string }
) {
  const response = await api.put(`/settings/${settingId}/update/`, payload);
  return response.data;
}

export async function bulkUpdateAdminSettings(
  payload: { settings: Array<{ id: number; value: string }> }
) {
  const response = await api.put("/settings/bulk-update/", payload);
  return response.data;
}

/* =========================
   STUDENTS
========================= */
export async function getAdminStudents() {
  const response = await api.get("/students/admin/students/");
  return response.data;
}

export async function createAdminStudent(payload: FormData) {
  const response = await api.post("/students/admin/students/create/", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function updateAdminStudent(studentId: number, payload: FormData) {
  const response = await api.put(
    `/students/admin/students/${studentId}/update/`,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function deactivateAdminStudent(studentId: number) {
  const response = await api.post(`/students/admin/students/${studentId}/deactivate/`);
  return response.data;
}

export async function activateAdminStudent(studentId: number) {
  const response = await api.post(`/students/admin/students/${studentId}/activate/`);
  return response.data;
}

/* =========================
   TEACHERS
========================= */
export async function getAdminTeachers() {
  const response = await api.get("/students/admin/teachers/");
  return response.data;
}

export async function createAdminTeacher(payload: FormData) {
  const response = await api.post("/students/admin/teachers/create/", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function updateAdminTeacher(teacherId: number, payload: FormData) {
  const response = await api.put(
    `/students/admin/teachers/${teacherId}/update/`,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function deactivateAdminTeacher(teacherId: number) {
  const response = await api.post(`/students/admin/teachers/${teacherId}/deactivate/`);
  return response.data;
}

export async function activateAdminTeacher(teacherId: number) {
  const response = await api.post(`/students/admin/teachers/${teacherId}/activate/`);
  return response.data;
}

/* =========================
   CLASSES
========================= */
export async function getAdminClasses() {
  const response = await api.get("/classes/");
  return response.data;
}

export async function createAdminClass(payload: {
  name: string;
  arm?: string;
  branch: number;
  section: number;
}) {
  const response = await api.post("/classes/create/", payload);
  return response.data;
}

export async function updateAdminClass(
  classId: number,
  payload: {
    name: string;
    arm?: string;
    branch: number;
    section: number;
  }
) {
  const response = await api.put(`/classes/${classId}/update/`, payload);
  return response.data;
}

/* =========================
   SUBJECTS
========================= */
export async function getAdminSubjects() {
  const response = await api.get("/academics/admin/subjects/");
  return response.data;
}

export async function createAdminSubject(payload: {
  name: string;
  code?: string;
}) {
  const response = await api.post("/academics/admin/subjects/create/", payload);
  return response.data;
}

export async function updateAdminSubject(
  subjectId: number,
  payload: {
    name: string;
    code?: string;
  }
) {
  const response = await api.put(
    `/academics/admin/subjects/${subjectId}/update/`,
    payload
  );
  return response.data;
}

/* =========================
   LOOKUP DATA
========================= */
export async function getBranches() {
  const response = await api.get("/branches/");
  return response.data;
}

export async function getSections() {
  const response = await api.get("/sections/");
  return response.data;
}

export async function getSchoolClasses() {
  const response = await api.get("/classes/");
  return response.data;
}

export async function getSessions() {
  const response = await api.get("/sessions/");
  return response.data;
}

export async function getAcademicSessions() {
  const response = await api.get("/sessions/");
  return response.data;
}

export async function getTerms() {
  const response = await api.get("/academics/terms/");
  return response.data;
}

/* =========================
   RESULT PINS
========================= */
export async function getAdminResultPins() {
  const response = await api.get("/academics/admin/result-pins/");
  return response.data;
}

export async function createAdminResultPin(payload: {
  student: string;
  term: string;
}) {
  const response = await api.post("/academics/admin/result-pins/", payload);
  return response.data;
}

/* =========================
   ASSIGNMENTS
========================= */
export async function getAdminAssignments() {
  const response = await api.get("/academics/admin/assignments/");
  return response.data;
}

export async function createAdminAssignment(payload: {
  teacher: number;
  class_subject: number;
}) {
  const response = await api.post("/academics/admin/assignments/create/", payload);
  return response.data;
}

export async function updateAdminAssignment(
  assignmentId: number,
  payload: {
    teacher: number;
    class_subject: number;
  }
) {
  const response = await api.put(
    `/academics/admin/assignments/${assignmentId}/update/`,
    payload
  );
  return response.data;
}

export async function getAssignmentTeachers() {
  const response = await api.get("/students/admin/teachers/");
  return response.data;
}

export async function getAdminClassSubjects() {
  const response = await api.get("/academics/admin/class-subjects/");
  return response.data;
}

export async function getManagedClassSubjects() {
  const response = await api.get("/academics/admin/class-subjects/manage/");
  return response.data;
}

export async function createAdminClassSubject(payload: {
  school_class: number;
  subject: number;
  session: number;
}) {
  const response = await api.post("/academics/admin/class-subjects/create/", payload);
  return response.data;
}

export async function updateAdminClassSubject(
  classSubjectId: number,
  payload: {
    school_class: number;
    subject: number;
    session: number;
  }
) {
  const response = await api.put(
    `/academics/admin/class-subjects/${classSubjectId}/update/`,
    payload
  );
  return response.data;
}

/* =========================
   CLASS TEACHER ASSIGNMENTS
========================= */
export async function getAdminClassTeacherAssignments() {
  const response = await api.get("/academics/admin/class-teacher-assignments/");
  return response.data;
}

export async function createAdminClassTeacherAssignment(payload: {
  teacher: number;
  school_class: number;
  session: number;
}) {
  const response = await api.post("/academics/admin/class-teacher-assignments/", payload);
  return response.data;
}

export async function updateAdminClassTeacherAssignment(
  assignmentId: number,
  payload: {
    teacher: number;
    school_class: number;
    session: number;
  }
) {
  const response = await api.put(
    `/academics/admin/class-teacher-assignments/${assignmentId}/`,
    payload
  );
  return response.data;
}

export async function deleteAdminClassTeacherAssignment(assignmentId: number) {
  const response = await api.delete(
    `/academics/admin/class-teacher-assignments/${assignmentId}/`
  );
  return response.data;
}

/* =========================
   REPORT CARDS / HEAD TEACHER REMARKS
========================= */
export async function getAdminReportCards(params?: {
  term?: string | number;
  class?: string | number;
  session?: string | number;
}) {
  const search = new URLSearchParams();

  if (params?.term) search.append("term", String(params.term));
  if (params?.class) search.append("class", String(params.class));
  if (params?.session) search.append("session", String(params.session));

  const queryString = search.toString();
  const response = await api.get(
    `/academics/admin/report-cards/${queryString ? `?${queryString}` : ""}`
  );
  return response.data;
}

export async function updateAdminHeadTeacherRemark(
  reportCardId: number,
  payload: {
    head_teacher_remark: string;
    performance_rating?: string;
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
    `/academics/admin/report-cards/${reportCardId}/head-teacher-remark/`,
    payload
  );
  return response.data;
}

/* =========================
   FINANCE
========================= */
export async function getAdminFeeStructures() {
  const response = await api.get("/finance/admin/fee-structures/");
  return response.data;
}

export async function createAdminFeeStructure(payload: {
  branch: number;
  section: number;
  school_class: number;
  term: number;
  name: string;
  amount: string;
}) {
  const response = await api.post("/finance/admin/fee-structures/", payload);
  return response.data;
}

export async function updateAdminFeeStructure(
  feeStructureId: number,
  payload: {
    branch: number;
    section: number;
    school_class: number;
    term: number;
    name: string;
    amount: string;
  }
) {
  const response = await api.put(
    `/finance/admin/fee-structures/${feeStructureId}/update/`,
    payload
  );
  return response.data;
}

export async function getAdminStudentFees() {
  const response = await api.get("/finance/admin/student-fees/");
  return response.data;
}

export async function assignAdminStudentFee(payload: {
  student: number;
  fee_structure: number;
}) {
  const response = await api.post("/finance/admin/student-fees/", payload);
  return response.data;
}

export async function updateAdminStudentFee(
  studentFeeId: number,
  payload: {
    student: number;
    fee_structure: number;
  }
) {
  const response = await api.put(
    `/finance/admin/student-fees/${studentFeeId}/update/`,
    payload
  );
  return response.data;
}

export async function getAdminPayments() {
  const response = await api.get("/finance/admin/payments/");
  return response.data;
}

export async function createAdminPayment(payload: {
  student_fee: number;
  amount_paid: string;
  payment_date: string;
  reference?: string;
}) {
  const response = await api.post("/finance/admin/payments/", payload);
  return response.data;
}