import { NextResponse } from "next/server";

const DEFAULT_BACKEND_BASE = "http://localhost:4000";

function normalizeBackendBase(rawBase?: string) {
  const value = (rawBase || "").trim();

  if (!value) {
    return DEFAULT_BACKEND_BASE;
  }

  if (value.startsWith("/")) {
    return DEFAULT_BACKEND_BASE;
  }

  if (/^https?:\/\//i.test(value)) {
    return value.replace(/\/$/, "");
  }

  try {
    const withProtocol = `http://${value}`;
    const parsed = new URL(withProtocol);
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

export async function GET() {
  const apiBase = getBackendBase();

  try {
    const response = await fetch(buildEndpoint(apiBase, "/api/candidatos"), {
      method: "GET",
      cache: "no-store",
    });

    const text = await response.text();
    return new NextResponse(text || "[]", {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível conectar ao backend." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const apiBase = getBackendBase();

  const body = await parseBody(request);
  if (!body) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  try {
    const response = await fetch(buildEndpoint(apiBase, "/api/candidatos"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
