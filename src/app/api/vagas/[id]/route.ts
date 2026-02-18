import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND_BASE = "http://localhost:4000";

function normalizeBackendBase(rawBase?: string) {
  const value = (rawBase || "").trim();

  if (!value) return DEFAULT_BACKEND_BASE;
  if (value.startsWith("/")) return DEFAULT_BACKEND_BASE;

  const withProtocol = /^https?:\/\//i.test(value) ? value : `http://${value}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.port === "3000") return DEFAULT_BACKEND_BASE;
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

async function parseBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const apiBase = getBackendBase();

  const { id } = await context.params;
  const body = await parseBody(request);
  if (!body) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const req = request as NextRequest;
  const authHeader = req.headers.get("Authorization") || "";
  const tokenFromHeader = authHeader.replace("Bearer ", "").trim();
  const tokenFromCookie = req.cookies.get("rhesult_token")?.value || "";
  const token = tokenFromHeader || tokenFromCookie;

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(buildEndpoint(apiBase, `/api/vagas/${id}`), {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await response.text();
    return new NextResponse(text || "{}", {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível conectar ao backend." }, { status: 502 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const apiBase = getBackendBase();

  const { id } = await context.params;

  const req = _ as NextRequest;
  const authHeader = req.headers.get("Authorization") || "";
  const tokenFromHeader = authHeader.replace("Bearer ", "").trim();
  const tokenFromCookie = req.cookies.get("rhesult_token")?.value || "";
  const token = tokenFromHeader || tokenFromCookie;

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(buildEndpoint(apiBase, `/api/vagas/${id}`), {
      method: "DELETE",
      headers,
      cache: "no-store",
    });

    const text = await response.text();
    return new NextResponse(text || "{}", {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível conectar ao backend." }, { status: 502 });
  }
}
