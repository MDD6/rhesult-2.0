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

export async function POST(req: NextRequest) {
  try {
    const apiBase = normalizeBackendBase(process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE);
    const contentType = req.headers.get("content-type") || "";
    let body: BodyInit;
    const forwardHeaders: Record<string, string> = {};

    if (contentType.includes("application/json")) {
      // JSON payload
      const jsonData = await req.json() as Record<string, unknown>;
      body = JSON.stringify(jsonData);
      forwardHeaders["Content-Type"] = "application/json";
    } else {
      // FormData payload
      body = await req.formData();
    }

    const response = await fetch(`${apiBase}/public/candidatos`, {
      method: "POST",
      body: body,
      headers: Object.keys(forwardHeaders).length > 0 ? forwardHeaders : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[POST /api/public/candidatos] Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: errorText || "Erro ao enviar candidatura" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[POST /api/public/candidatos]", error);
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: `Erro interno ao processar candidatura: ${errorMsg}` },
      { status: 500 }
    );
  }
}
