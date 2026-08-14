import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const rawBackendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://127.0.0.1:8000";
const BACKEND_URL = rawBackendUrl.replace(/\/+$/, "");

async function handleProxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const path = params.path.join("/");
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const url = `${BACKEND_URL}/api/v1/${path}${request.nextUrl.search}`;
  
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  
  if (contentType) headers.set("Content-Type", contentType);
  if (accept) headers.set("Accept", accept);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  try {
    const method = request.method;
    const hasBody = ["POST", "PUT", "PATCH"].includes(method);
    const body = hasBody ? await request.arrayBuffer() : undefined;

    const response = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    const resContentType = response.headers.get("content-type");
    const resContentDisp = response.headers.get("content-disposition");
    
    if (resContentType) responseHeaders.set("Content-Type", resContentType);
    if (resContentDisp) responseHeaders.set("Content-Disposition", resContentDisp);

    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("API proxy error for URL:", url, error);
    return NextResponse.json(
      { detail: error?.message || "Erreur de communication avec le serveur Backend FastAPI" },
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
