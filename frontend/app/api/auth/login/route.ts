import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Authentication failed" }));
      return NextResponse.json(errData, { status: res.status });
    }
    
    const data = await res.json();
    const cookieStore = await cookies();
    
    cookieStore.set("token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json({ detail: "Erreur de connexion au serveur backend." }, { status: 500 });
  }
}
