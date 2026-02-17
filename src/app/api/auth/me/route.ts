import { NextResponse, NextRequest } from "next/server";

function getBackendBase() {
  return process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
}

function buildEndpoint(base: string, path: string) {
  return `${base.replace(/\/$/, "")}${path}`;
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
    const token = authHeader.replace("Bearer ", "");

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

    if (!response.ok) {
      const text = await response.text();
      const data = text ? JSON.parse(text) : { error: "Failed to fetch user profile" };
      return NextResponse.json(data, { status: response.status });
    }

    const data = await response.json();
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
    const body = await request.json();

    // Get token from Authorization header or cookie
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const url = buildEndpoint(apiBase, "/auth/me");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Pass token if available
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      const data = text ? JSON.parse(text) : { error: "Failed to update user profile" };
      return NextResponse.json(data, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[PUT /api/auth/me]", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
