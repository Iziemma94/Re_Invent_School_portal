"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
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
  const [buttonHovered, setButtonHovered] = useState(false);
  const [backHovered, setBackHovered] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE}/token/`,
        { username, password }
      );

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
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #071633 0%, #0b1f4d 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 24px 12px",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "1200px",
            minHeight: "720px",
            background: "#0b1020",
            borderRadius: "30px",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "1fr 1.1fr",
            boxShadow: "0 28px 70px rgba(0,0,0,0.4)",
          }}
        >
          {/* LEFT PANEL */}
          <div
            style={{
              background: "linear-gradient(180deg, #050b18 0%, #071126 100%)",
              color: "white",
              padding: "40px 52px 56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div style={{ width: "100%", maxWidth: "370px" }}>
              <button
                type="button"
                onMouseEnter={() => setBackHovered(true)}
                onMouseLeave={() => setBackHovered(false)}
                onClick={() => router.push("/")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: backHovered
                    ? "rgba(255,255,255,0.12)"
                    : "transparent",
                  color: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "999px",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  marginBottom: "28px",
                }}
              >
                <ArrowLeft size={16} />
                Back Home
              </button>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "30px",
                }}
              >
                <div
                  style={{
                    width: "108px",
                    height: "108px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.96)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow:
                      "0 0 0 8px rgba(37,99,235,0.12), 0 14px 35px rgba(37,99,235,0.25)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "78px",
                      height: "78px",
                    }}
                  >
                    <Image
                      src="/school-logo.jpeg"
                      alt="School logo"
                      fill
                      style={{ objectFit: "contain" }}
                      priority
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "26px",
                  padding: "28px",
                  boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: "50px",
                    fontWeight: 800,
                    lineHeight: 1.05,
                    color: "white",
                  }}
                >
                  Login
                </h1>

                <p
                  style={{
                    marginTop: "14px",
                    marginBottom: "30px",
                    color: "rgba(255,255,255,0.72)",
                    fontSize: "16px",
                  }}
                >
                  Enter your login details to access your dashboard.
                </p>

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "18px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "10px",
                        fontSize: "14px",
                        color: "rgba(255,255,255,0.86)",
                        fontWeight: 600,
                      }}
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      required
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "16px",
                        color: "white",
                        fontSize: "16px",
                        padding: "16px 18px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "18px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "10px",
                        fontSize: "14px",
                        color: "rgba(255,255,255,0.86)",
                        fontWeight: 600,
                      }}
                    >
                      Password
                    </label>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "16px",
                        padding: "0 16px",
                      }}
                    >
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          color: "white",
                          fontSize: "16px",
                          padding: "16px",
                          outline: "none",
                          
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "rgba(255,255,255,0.7)",
                          cursor: "pointer",
                          padding: "0 0 0 12px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div
                      style={{
                        marginTop: "18px",
                        marginBottom: "18px",
                        borderRadius: "14px",
                        background: "rgba(220,38,38,0.12)",
                        border: "1px solid rgba(248,113,113,0.25)",
                        color: "#fca5a5",
                        padding: "12px 14px",
                        fontSize: "14px",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    onMouseEnter={() => setButtonHovered(true)}
                    onMouseLeave={() => setButtonHovered(false)}
                    style={{
                      width: "100%",
                      marginTop: "20px",
                      background: submitting
                        ? "linear-gradient(135deg, #3b82f6, #60a5fa)"
                        : "linear-gradient(135deg, #2563eb, #3b82f6)",
                      color: "white",
                      border: "none",
                      borderRadius: "16px",
                      padding: "16px 20px",
                      fontSize: "16px",
                      fontWeight: 700,
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.85 : 1,
                      boxShadow: buttonHovered
                        ? "0 18px 36px rgba(37,99,235,0.38)"
                        : "0 14px 30px rgba(37,99,235,0.3)",
                      transform:
                        buttonHovered && !submitting
                          ? "translateY(-2px)"
                          : "translateY(0)",
                      transition: "all 0.25s ease",
                    }}
                  >
                    {submitting ? "Signing in..." : "Login"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #2563eb 0%, #3b82f6 42%, #60a5fa 100%)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.12,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-40px",
                  left: "-40px",
                  width: "260px",
                  height: "260px",
                  borderRadius: "999px",
                  background: "white",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50px",
                  right: "30px",
                  width: "230px",
                  height: "230px",
                  borderRadius: "999px",
                  background: "white",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "-30px",
                  left: "30px",
                  width: "250px",
                  height: "250px",
                  borderRadius: "999px",
                  background: "white",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "30px",
                  right: "-30px",
                  width: "250px",
                  height: "250px",
                  borderRadius: "999px",
                  background: "white",
                }}
              />
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                width: "100%",
                maxWidth: "540px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "64px",
                    fontWeight: 800,
                    lineHeight: 0.95,
                    color: "white",
                  }}
                >
                  Welcome to Re-Invent
                </h2>
                <p
                  style={{
                    margin: "8px 0 0 0",
                    fontSize: "58px",
                    lineHeight: 1,
                    color: "rgba(255,255,255,0.95)",
                    fontWeight: 300,
                  }}
                >
                  schools portal
                </p>

                <p
                  style={{
                    marginTop: "18px",
                    color: "rgba(255,255,255,0.84)",
                    fontSize: "18px",
                  }}
                >
                  Use your assigned portal credentials to access student,
                  teacher, or administrator features.
                </p>
              </div>

              <div
                style={{
                  marginTop: "26px",
                  borderRadius: "28px",
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  padding: "12px",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "340px",
                    borderRadius: "22px",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src="/dark2.jpg"
                    alt="Portal illustration"
                    fill
                    style={{
                      objectFit: "cover",
                      filter: "saturate(1.02) contrast(1.02)",
                    }}
                    priority
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, rgba(37,99,235,0.08), rgba(37,99,235,0.14))",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <AppFooter />
    </main>
  );
}