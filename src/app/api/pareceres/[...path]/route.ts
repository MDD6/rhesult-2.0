import { NextRequest, NextResponse } from "next/server";

function getBackendBase() {
  return process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "";
}

function buildEndpoint(base: string, path: string) {
  return `${base.replace(/\/$/, "")}${path}`;
}

function buildPath(request: NextRequest, context: RouteContext) {
  const path = context.params.path.join("/");
  const query = request.nextUrl.searchParams.toString();
  return query ? `/api/pareceres/${path}?${query}` : `/api/pareceres/${path}`;
}

async function parseBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

type RouteContext = {
  params: { path: string[] };
};

async function proxy(method: string, request: NextRequest, context: RouteContext) {
  const apiBase = getBackendBase();
  if (!apiBase) {
    return NextResponse.json({ error: "API_BASE não configurada no servidor Next.js." }, { status: 500 });
  }

  const body = method === "GET" || method === "DELETE" ? null : await parseBody(request);
  if ((method === "POST" || method === "PUT" || method === "PATCH") && !body) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  try {
    const response = await fetch(buildEndpoint(apiBase, buildPath(request, context)), {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const text = await response.text();
    return new NextResponse(text || (method === "GET" ? "[]" : "{}"), {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível conectar ao backend." }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy("GET", request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy("POST", request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy("PUT", request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy("PATCH", request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy("DELETE", request, context);
}
