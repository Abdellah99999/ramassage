import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }
  
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      cache: "no-store"
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        cookieStore.delete("token");
      }
      const errData = await res.json().catch(() => ({ detail: "Unauthorized" }));
      return NextResponse.json(errData, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Auth me route error:", error);
    return NextResponse.json({ detail: "Backend connection error" }, { status: 502 });
  }
}
