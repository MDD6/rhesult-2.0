import { NextResponse } from "next/server";

function getBackendBase() {
  return process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "";
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
  if (!apiBase) {
    return NextResponse.json({ error: "API_BASE não configurada no servidor Next.js." }, { status: 500 });
  }

  const { id } = await context.params;
  const body = await parseBody(request);
  if (!body) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  try {
    const response = await fetch(buildEndpoint(apiBase, `/api/vagas/${id}`), {
      method: "PUT",
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

export async function DELETE(_: Request, context: RouteContext) {
  const apiBase = getBackendBase();
  if (!apiBase) {
    return NextResponse.json({ error: "API_BASE não configurada no servidor Next.js." }, { status: 500 });
  }

  const { id } = await context.params;

  try {
    const response = await fetch(buildEndpoint(apiBase, `/api/vagas/${id}`), {
      method: "DELETE",
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
