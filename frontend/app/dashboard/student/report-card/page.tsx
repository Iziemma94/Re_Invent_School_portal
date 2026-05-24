"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentReportCardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/student/check-result");
  }, [router]);

  return null;
}