import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  try {
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

    const response = await fetch(`${API_BASE}/public/candidatos`, {
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
