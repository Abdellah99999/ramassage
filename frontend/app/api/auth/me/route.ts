import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockStore } from "../../../../lib/mockData";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) {
    return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
  }

  try {
    let payload: any = null;
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      payload = JSON.parse(decoded);
    } catch {
      payload = { email: "admin@hes.com" };
    }

    const users = mockStore.getUsers();
    const user = users.find(u => u.email.toLowerCase() === payload.email?.toLowerCase()) || users[0];

    const agencies = mockStore.getAgencies();
    const agency = user.agence_id ? agencies.find(a => a.id === user.agence_id) : null;

    return NextResponse.json({
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      agence_id: user.agence_id,
      actif: user.actif,
      agency: agency ? { id: agency.id, nom: agency.nom, ville: agency.ville || "" } : null
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ detail: "Erreur de session" }, { status: 500 });
  }
}
