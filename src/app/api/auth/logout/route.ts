import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND_BASE = "http://localhost:4000";

function normalizeBackendBase(rawBase?: string) {
  const value = (rawBase || "").trim();

  if (!value) return DEFAULT_BACKEND_BASE;
  if (value.startsWith("/")) return DEFAULT_BACKEND_BASE;

  const withProtocol = /^https?:\/\//i.test(value) ? value : `http://${value}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.port === "3000") {
      return DEFAULT_BACKEND_BASE;
    }

    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return DEFAULT_BACKEND_BASE;
  }
}

function getBackendBase() {
  return normalizeBackendBase(process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE);
}

function buildEndpoint(base: string, routePath: string) {
  return `${base.replace(/\/$/, "")}${routePath}`;
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "").trim() || "";
  const backendToken = token || request.cookies.get("rhesult_token")?.value || "";

  if (backendToken) {
    const apiBase = getBackendBase();

    try {
      await fetch(buildEndpoint(apiBase, "/auth/logout"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${decodeURIComponent(backendToken)}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
    } catch {
      // Ignora erro de rede no backend e segue limpando cookie local
    }
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });

  response.cookies.set({
    name: "rhesult_token",
    value: "",
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
