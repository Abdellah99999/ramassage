import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function handleProxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const path = params.path.join("/");
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  // log presence of token (non-sensitive) for debugging
  // actual method is determined below
  
  const url = `${BACKEND_URL}/api/v1/${path}${request.nextUrl.search}`;
  
  // Forward original request headers, but remove host
  const headers = new Headers(request.headers);
  headers.delete("host");
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  try {
    const method = request.method;
    const hasBody = method !== "GET" && method !== "DELETE" && method !== "HEAD";
    const body = hasBody ? await request.arrayBuffer() : undefined;

    const response = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    // keep minimal logging for server-side diagnostics
    console.error("API proxy error for URL:", url, error);
    return NextResponse.json(
      { detail: error?.message || "Backend communication failed" },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
export const HEAD = handleProxy;
