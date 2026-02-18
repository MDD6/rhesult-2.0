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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const backendBase = getBackendBase();
  const params = await context.params;
  const filePath = params.path?.join("/") || "";

  if (!filePath) {
    return NextResponse.json({ error: "Arquivo não informado." }, { status: 400 });
  }

  const search = request.nextUrl.search || "";
  const targetUrl = `${backendBase}/uploads/${filePath}${search}`;

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: text || "Não foi possível abrir o currículo." },
        { status: response.status },
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers();

    const contentType = response.headers.get("content-type");
    if (contentType) {
      headers.set("content-type", contentType);
    }

    const contentDisposition = response.headers.get("content-disposition");
    if (contentDisposition) {
      headers.set("content-disposition", contentDisposition);
    }

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível conectar ao backend para baixar o currículo." },
      { status: 502 },
    );
  }
}
