"use client";

import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();

  const loggedIn =
    typeof window !== "undefined" ? isLoggedIn() : false;

  if (typeof window !== "undefined" && !loggedIn) {
    router.push("/login");
    return null;
  }

  return <>{children}</>;
}