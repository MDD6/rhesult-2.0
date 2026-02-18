import { NextResponse, NextRequest } from "next/server";

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

function buildEndpoint(base: string, path: string) {
  return `${base.replace(/\/$/, "")}${path}`;
}

async function parseResponsePayload(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
}

/**
 * GET /api/auth/me
 * Fetch current authenticated user profile from backend
 */
export async function GET(request: NextRequest) {
  const apiBase = getBackendBase();

  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get("Authorization") || "";
    const tokenFromHeader = authHeader.replace("Bearer ", "").trim();
    const tokenFromCookie = request.cookies.get("rhesult_token")?.value || "";
    const token = tokenFromHeader || tokenFromCookie;

    const url = buildEndpoint(apiBase, "/auth/me");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Pass token if available
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await parseResponsePayload(response);

    if (!response.ok) {
      return NextResponse.json(
        typeof data === "object" && data ? (data as Record<string, unknown>) : { error: "Failed to fetch user profile" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/me
 * Update current authenticated user profile
 */
export async function PUT(request: NextRequest) {
  const apiBase = getBackendBase();

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: BodyInit;
    const headers: HeadersInit = {};

    if (contentType.includes("multipart/form-data")) {
      body = await request.formData();
    } else {
      const jsonBody = await request.json();
      body = JSON.stringify(jsonBody);
      headers["Content-Type"] = "application/json";
    }

    // Get token from Authorization header or cookie
    const authHeader = request.headers.get("Authorization") || "";
    const tokenFromHeader = authHeader.replace("Bearer ", "").trim();
    const tokenFromCookie = request.cookies.get("rhesult_token")?.value || "";
    const token = tokenFromHeader || tokenFromCookie;

    const url = buildEndpoint(apiBase, "/auth/me");

    // Pass token if available
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body,
      cache: "no-store",
    });

    const data = await parseResponsePayload(response);

    if (!response.ok) {
      return NextResponse.json(
        typeof data === "object" && data ? (data as Record<string, unknown>) : { error: "Failed to update user profile" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[PUT /api/auth/me]", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
