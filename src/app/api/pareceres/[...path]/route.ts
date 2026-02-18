import { NextRequest, NextResponse } from "next/server";

function getBackendBase() {
  return process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "";
}

function buildEndpoint(base: string, path: string) {
  const cleanBase = base.replace(/\/$/, "");
  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

type RouteParams = { path: string[] };

type RouteContext = {
  params: Promise<RouteParams>;
};

function buildPath(request: NextRequest, params: RouteParams) {
  const path = params.path.join("/");
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

async function proxy(method: string, request: NextRequest, params: RouteParams) {
  const apiBase = getBackendBase();
  
  if (!apiBase) {
    return NextResponse.json({ error: "API_BASE não configurada no servidor Next.js." }, { status: 500 });
  }

  // Only GET and DELETE don't have body usually.
  const hasBody = method !== "GET" && method !== "DELETE";
  let body = null;
  
  if (hasBody) {
    body = await parseBody(request);
    if (!body && method !== 'GET') { // strict check?
       // Let empty body pass for now if needed, but original code checked if !body
    }
  }

  try {
    const endpoint = buildEndpoint(apiBase, buildPath(request, params));
    
    // Forward headers if needed (Authorization)
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    
    // If request has auth header, forward it
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
        headers['Authorization'] = authHeader;
    }

    const response = await fetch(endpoint, {
      method,
      headers: hasBody ? headers : { ...headers },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const text = await response.text();
    // Default empty array for GET, empty object for others if empty
    const defaultResponse = method === "GET" ? "[]" : "{}";
    
    return new NextResponse(text || defaultResponse, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("Proxy Error:", err);
    return NextResponse.json({ error: "Não foi possível conectar ao backend.", details: String(err) }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxy("GET", request, params);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxy("POST", request, params);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxy("PUT", request, params);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxy("PATCH", request, params);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxy("DELETE", request, params);
}
