"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/axios";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { saveTokens } from "@/lib/auth";
import { getCurrentUser } from "@/services/accountService";
import AppFooter from "@/components/common/AppFooter";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setError("");
  setSubmitting(true);

  try {
    const response = await api.post("/token/", {
      username,
      password,
    });

    saveTokens(response.data.access, response.data.refresh);

    const currentUser = await getCurrentUser();

    if (currentUser.role === "student") {
      router.push("/dashboard/student");
    } else if (currentUser.role === "teacher") {
      router.push("/dashboard/teacher");
    } else if (currentUser.role === "admin") {
      router.push("/dashboard/admin");
    } else {
      router.push("/");
    }
  } catch (err) {
    console.error(err);
    setError("Invalid username or password.");
  } finally {
    setSubmitting(false);
  }
}

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-[#071633] to-[#0b1f4d] font-sans">
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
          <section className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-[#0b1020] shadow-2xl lg:min-h-[720px] lg:grid-cols-[1fr_1.1fr]">
            {/* LEFT PANEL */}
            <div className="flex items-center justify-center bg-gradient-to-b from-[#050b18] to-[#071126] px-5 py-8 text-white sm:px-8 lg:px-12">
              <div className="w-full max-w-md">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  <ArrowLeft size={16} />
                  Back Home
                </button>

                <div className="mb-8 flex justify-center">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_0_0_8px_rgba(37,99,235,0.12),0_14px_35px_rgba(37,99,235,0.25)]">
                    <div className="relative h-20 w-20">
                      <Image
                        src="/school-logo.jpeg"
                        alt="School logo"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur sm:p-8">
                  <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                    Login
                  </h1>

                  <p className="mt-4 text-sm leading-6 text-white/70 sm:text-base">
                    Enter your login details to access your dashboard.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white/90">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        required
                        autoComplete="username"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 text-base text-white outline-none transition placeholder:text-white/40 focus:border-blue-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white/90">
                        Password
                      </label>

                      <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.05] px-4 transition focus-within:border-blue-400">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                          required
                          autoComplete="current-password"
                          className="w-full bg-transparent py-4 pr-3 text-base text-white outline-none placeholder:text-white/40"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="flex items-center text-white/70 transition hover:text-white"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 px-5 py-4 text-base font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(37,99,235,0.38)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                      {submitting ? "Signing in..." : "Login"}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-blue-500 to-sky-400 p-10 lg:flex lg:items-center lg:justify-center">
              <div className="pointer-events-none absolute inset-0 opacity-10">
                <div className="absolute -left-12 -top-12 h-72 w-72 rounded-full bg-white" />
                <div className="absolute right-8 top-14 h-64 w-64 rounded-full bg-white" />
                <div className="absolute bottom-8 left-10 h-72 w-72 rounded-full bg-white" />
                <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-white" />
              </div>

              <div className="relative z-10 flex h-full w-full max-w-xl flex-col justify-between">
                <div>
                  <h2 className="text-5xl font-extrabold leading-none text-white xl:text-6xl">
                    Welcome to Re-Invent
                  </h2>

                  <p className="mt-3 text-4xl font-light leading-tight text-white/95 xl:text-5xl">
                    schools portal
                  </p>

                  <p className="mt-5 max-w-lg text-base leading-7 text-white/85">
                    Use your assigned portal credentials to access student,
                    teacher, or administrator features.
                  </p>
                </div>

                <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur">
                  <div className="relative h-[340px] w-full overflow-hidden rounded-[1.35rem]">
                    <Image
                      src="/dark2.jpg"
                      alt="Portal illustration"
                      fill
                      className="object-cover contrast-105 saturate-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-blue-600/20" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <AppFooter />
      </div>
    </main>
  );
}