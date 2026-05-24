"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import AppFooter from "@/components/common/AppFooter";

export default function HomePage() {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#062f3b",
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
          padding: "40px 24px 16px",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "1200px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "48px",
            alignItems: "center",
          }}
        >
          <div style={{ color: "white" }}>
            <p
              style={{
                fontSize: "20px",
                fontWeight: 600,
                opacity: 0.9,
                margin: 0,
              }}
            >
              Re-Invent Schools Portal
            </p>

            <h1
              style={{
                fontSize: "clamp(36px, 5vw, 62px)",
                lineHeight: 1.15,
                fontWeight: 800,
                margin: "20px 0 0 0",
                color: "white",
              }}
            >
              <span style={{ color: "#2563eb" }}>Creating</span> a Better Future
              <br />
              through Education
            </h1>

            <p
              style={{
                marginTop: "24px",
                maxWidth: "520px",
                fontSize: "18px",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              A simple and modern school portal for students, teachers, and
              administrators to manage academic activities with ease.
            </p>

            <div
              style={{
                display: "flex",
                gap: "16px",
                marginTop: "32px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onMouseEnter={() => setHovered("login")}
                onMouseLeave={() => setHovered(null)}
                onClick={() => router.push("/login")}
                style={{
                  background:
                    hovered === "login"
                      ? "linear-gradient(135deg, #1d4ed8, #2563eb)"
                      : "linear-gradient(135deg, #2563eb, #3b82f6)",
                  color: "white",
                  border: "none",
                  borderRadius: "999px",
                  padding: "14px 32px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform:
                    hovered === "login"
                      ? "translateY(-3px) scale(1.02)"
                      : "translateY(0)",
                  boxShadow:
                    hovered === "login"
                      ? "0 14px 30px rgba(37,99,235,0.45)"
                      : "0 8px 20px rgba(37,99,235,0.25)",
                }}
              >
                Login
              </button>

              <button
                type="button"
                onMouseEnter={() => setHovered("start")}
                onMouseLeave={() => setHovered(null)}
                onClick={() => router.push("/login")}
                style={{
                  background:
                    hovered === "start"
                      ? "rgba(255,255,255,0.16)"
                      : "transparent",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.35)",
                  borderRadius: "999px",
                  padding: "14px 32px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform:
                    hovered === "start"
                      ? "translateY(-3px) scale(1.02)"
                      : "translateY(0)",
                  boxShadow:
                    hovered === "start"
                      ? "0 10px 24px rgba(255,255,255,0.12)"
                      : "none",
                  backdropFilter: "blur(6px)",
                }}
              >
                Get Started
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "460px",
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: "36px",
                  padding: "20px",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
                }}
              >
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: "28px",
                    height: "420px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <Image
                    src="/school1.jpg"
                    alt="School"
                    fill
                    style={{
                      objectFit: "cover",
                    }}
                    priority
                  />
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: "-20px",
                  top: "28px",
                  background: "white",
                  borderRadius: "22px",
                  padding: "18px 20px",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1,
                  }}
                >
                  Portal
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                >
                  Smart Access
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