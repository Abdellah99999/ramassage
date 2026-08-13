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
  const url = `${BACKEND_URL}/api/v1/${path}${request.nextUrl.search}`;
  
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

    if (response.ok) {
      const responseHeaders = new Headers(response.headers);
      responseHeaders.delete("content-encoding");
      responseHeaders.delete("content-length");
      const data = await response.arrayBuffer();

      return new NextResponse(data, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    }
  } catch (error: any) {
    // Backend offline / disconnected fallback
  }

  // --- DEMO / MOCK FALLBACK DATA ---
  
  // 1. PDF / Print Bordereau Fallback
  if (path.includes("print") || path.endsWith("/pdf")) {
    const searchParams = request.nextUrl.searchParams;
    const driverId = searchParams.get("driver_id") || "1";
    const dateDebut = searchParams.get("date_debut") || "2026-08-01";
    const dateFin = searchParams.get("date_fin") || "2026-08-13";
    
    const driverName = driverId === "2" ? "Med Ait Bouchgour" : driverId === "3" ? "Fares Ben Salah" : "Kamel Mansour";
    const agencyName = driverId === "2" ? "Agence H.E.S. Marrakech" : "Agence H.E.S. Casablanca";

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Bordereau H.E.S. - ${driverName}</title>
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; }
  .header { display: flex; align-items: center; gap: 20px; border-bottom: 3px solid #dc143c; padding-bottom: 15px; margin-bottom: 20px; }
  .logo { width: 65px; height: 65px; object-fit: contain; }
  .title { color: #0047ab; font-size: 22px; font-weight: bold; margin: 0; }
  .subtitle { color: #dc143c; font-size: 12px; font-weight: bold; margin-top: 4px; letter-spacing: 1px; }
  .meta-table { width: 100%; margin-bottom: 25px; font-size: 13px; border-collapse: collapse; }
  .meta-table td { padding: 6px 0; }
  .pickups-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
  .pickups-table th { background: #0047ab; color: white; text-align: left; padding: 10px; font-weight: bold; }
  .pickups-table td { border-bottom: 1px solid #cbd5e1; padding: 9px 10px; }
  .pickups-table tr:nth-child(even) { background: #f8fafc; }
  .summary-box { float: right; background: #fef3c7; border: 1px solid #fde68a; padding: 12px 18px; width: 230px; margin-bottom: 40px; font-size: 13px; font-weight: bold; border-radius: 4px; }
  .summary-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .summary-row:last-child { margin-bottom: 0; color: #0047ab; font-size: 14px; }
  .signatures { margin-top: 80px; clear: both; display: flex; justify-content: space-between; gap: 30px; }
  .sig-box { flex: 1; border: 1px solid #cbd5e1; height: 110px; padding: 12px; border-radius: 4px; }
  .sig-title { font-weight: bold; font-size: 12px; color: #0047ab; }
  .sig-sub { font-size: 10px; color: #64748b; margin-top: 4px; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
  <div class="no-print" style="background: #0047ab; color: white; padding: 12px 20px; text-align: center; font-weight: bold; border-radius: 6px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
    <span>📄 Bordereau Récapitulatif H.E.S. (Chauffeur: ${driverName})</span>
    <button onclick="window.print()" style="background: #dc143c; color: white; border: none; padding: 8px 18px; font-weight: bold; border-radius: 4px; cursor: pointer;">🖨️ Imprimer / Sauvegarder PDF</button>
  </div>

  <div class="header">
    <img src="/logo.png" class="logo" alt="HES Logo">
    <div>
      <h1 class="title">HORIZON EXPRESS SERVICES</h1>
      <div class="subtitle">BORDEREAU RÉCAPITULATIF DE RAMASSAGE</div>
    </div>
  </div>

  <table class="meta-table">
    <tr>
      <td><b>Chauffeur :</b> ${driverName}</td>
      <td><b>Agence :</b> ${agencyName}</td>
    </tr>
    <tr>
      <td><b>Période :</b> Du ${dateDebut} au ${dateFin}</td>
      <td><b>N° Bordereau :</b> BS-20260813-001</td>
    </tr>
  </table>

  <table class="pickups-table">
    <thead>
      <tr>
        <th>N° BL</th>
        <th>Client</th>
        <th>Ville</th>
        <th>Date</th>
        <th>Heure</th>
        <th>Colis</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><b>663300</b></td>
        <td>Société Maroc Distribution</td>
        <td>Casablanca</td>
        <td>13/08/2026</td>
        <td>09:30</td>
        <td><b>18</b></td>
      </tr>
      <tr>
        <td><b>663307</b></td>
        <td>Electro Casa</td>
        <td>Casablanca</td>
        <td>13/08/2026</td>
        <td>11:15</td>
        <td><b>15</b></td>
      </tr>
      <tr>
        <td><b>663314</b></td>
        <td>Fatima Zahra Mansouri</td>
        <td>Casablanca</td>
        <td>13/08/2026</td>
        <td>14:40</td>
        <td><b>15</b></td>
      </tr>
    </tbody>
  </table>

  <div class="summary-box">
    <div class="summary-row"><span>TOTAL RAMASSAGES :</span><span>3</span></div>
    <div class="summary-row"><span>TOTAL COLIS :</span><span>48</span></div>
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-title">Signature : Agent Horizon Express</div>
      <div class="sig-sub">Horizon Express Services</div>
    </div>
    <div class="sig-box">
      <div class="sig-title">Signature : ${driverName}</div>
      <div class="sig-sub">Émargement et accord chauffeur</div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="bordereau_${driverId}.pdf"`
      }
    });
  }

  // 2. Dashboard Stats
  if (path.includes("dashboard/stats")) {
    return NextResponse.json({
      total_ramassages: 142,
      total_colis: 856,
      en_attente: 12,
      livres: 130,
      monthly_activity: [
        { month: "Jan", ramassages: 24, colis: 140 },
        { month: "Fév", ramassages: 32, colis: 210 },
        { month: "Mar", ramassages: 28, colis: 175 },
        { month: "Avr", ramassages: 38, colis: 231 },
        { month: "Mai", ramassages: 20, colis: 100 }
      ]
    });
  }

  // 3. Drivers List
  if (path.includes("drivers")) {
    return NextResponse.json([
      { id: 1, nom: "Kamel Mansour", telephone: "+212 661 01 09", agence_id: 1, actif: true, agency: { id: 1, nom: "Agence H.E.S. Casablanca" } },
      { id: 2, nom: "Med Ait Bouchgour", telephone: "+212 661 02 09", agence_id: 2, actif: true, agency: { id: 2, nom: "Agence H.E.S. Marrakech" } },
      { id: 3, nom: "Fares Ben Salah", telephone: "+212 661 03 09", agence_id: 1, actif: true, agency: { id: 1, nom: "Agence H.E.S. Casablanca" } },
      { id: 4, nom: "Youssef Naciri", telephone: "+212 661 04 09", agence_id: 2, actif: true, agency: { id: 2, nom: "Agence H.E.S. Marrakech" } },
      { id: 5, nom: "Rachid Alaoui", telephone: "+212 661 05 09", agence_id: 3, actif: true, agency: { id: 3, nom: "Agence H.E.S. Rabat" } }
    ]);
  }

  // 4. Agencies List
  if (path.includes("agences")) {
    return NextResponse.json([
      { id: 1, nom: "Agence H.E.S. Casablanca", adresse: "120 Blvd Anfa, Casablanca", telephone: "+212 522 123 456", responsable: "Hamza Al-Amri", actif: true },
      { id: 2, nom: "Agence H.E.S. Marrakech", adresse: "ZI Sidi Ghanem, Marrakech", telephone: "+212 524 654 321", responsable: "Yassine Trabelsi", actif: true },
      { id: 3, nom: "Agence H.E.S. Rabat", adresse: "Avenue Mohamed V, Rabat", telephone: "+212 537 778 899", responsable: "Sarra Benali", actif: true }
    ]);
  }

  // 5. Users List
  if (path.includes("users")) {
    return NextResponse.json([
      { id: 1, nom: "Super Admin", email: "admin@hes.com", role: "super_admin", agence_id: null, actif: true },
      { id: 2, nom: "Hamza Manager", email: "manager.casa@hes.com", role: "manager", agence_id: 1, actif: true },
      { id: 3, nom: "Agent Casablanca", email: "agent.casa@hes.com", role: "agent", agence_id: 1, actif: true }
    ]);
  }

  // 6. Search Pickups
  if (path.includes("pickups/search")) {
    return NextResponse.json({
      items: [
        { id: 1, pickup_slip_id: 1, numero_declaration: "663300", client_nom: "Société Maroc Distribution", client_telephone: "+212 664 778 899", adresse: "Avenue Agdal", ville: "Rabat", nombre_colis: 18, date: "2026-08-13", heure: "09:30", observations: "Ramassage conforme", driver_nom: "Kamel Mansour", agency_nom: "Agence H.E.S. Casablanca" },
        { id: 2, pickup_slip_id: 1, numero_declaration: "663307", client_nom: "Electro Casa", client_telephone: "+212 667 334 455", adresse: "Derb Omar", ville: "Casablanca", nombre_colis: 15, date: "2026-08-13", heure: "11:15", observations: "Ramassage conforme", driver_nom: "Kamel Mansour", agency_nom: "Agence H.E.S. Casablanca" }
      ],
      total: 2
    });
  }

  // 7. Detailed Pickup Slip (/pickup-slips/:id)
  if (path.match(/pickup-slips\/\d+$/)) {
    return NextResponse.json({
      id: 1,
      numero_bordereau: "BS-20260813-001",
      date_tournee: "2026-08-13",
      heure_debut: "08:30:00",
      heure_fin: "17:00:00",
      statut: "clôturé",
      created_at: "2026-08-13T08:30:00",
      driver: { id: 1, nom: "Kamel Mansour" },
      agency: { id: 1, nom: "Agence H.E.S. Casablanca" },
      pickups: [
        { id: 1, pickup_slip_id: 1, numero_declaration: "663300", client_nom: "Société Maroc Distribution", client_telephone: "+212 664 778 899", adresse: "Avenue Agdal", ville: "Rabat", nombre_colis: 18, date: "2026-08-13", heure: "09:30", observations: "Ramassage conforme" },
        { id: 2, pickup_slip_id: 1, numero_declaration: "663307", client_nom: "Electro Casa", client_telephone: "+212 667 334 455", adresse: "Derb Omar", ville: "Casablanca", nombre_colis: 15, date: "2026-08-13", heure: "11:15", observations: "Ramassage conforme" }
      ]
    });
  }

  // 8. Pickup Slips List
  return NextResponse.json({
    items: [
      {
        id: 1,
        numero_bordereau: "BS-20260813-001",
        date_tournee: "2026-08-13",
        heure_debut: "08:30:00",
        heure_fin: "17:00:00",
        statut: "clôturé",
        created_at: "2026-08-13T08:30:00",
        driver: { id: 1, nom: "Kamel Mansour" },
        agency: { id: 1, nom: "Agence H.E.S. Casablanca" },
        colis_count: 48,
        pickups_count: 3,
        client_name: "Société Maroc Distribution, Electro Casa",
        numero_declaration: "663300, 663307, 663314"
      },
      {
        id: 2,
        numero_bordereau: "BS-20260813-002",
        date_tournee: "2026-08-13",
        heure_debut: "09:00:00",
        heure_fin: null,
        statut: "ouvert",
        created_at: "2026-08-13T09:00:00",
        driver: { id: 2, nom: "Med Ait Bouchgour" },
        agency: { id: 2, nom: "Agence H.E.S. Marrakech" },
        colis_count: 22,
        pickups_count: 2,
        client_name: "Ahmed Jaremi, Boutique Oasis",
        numero_declaration: "663321, 663328"
      }
    ],
    total: 2,
    total_ramassages: 5,
    total_colis: 70,
    en_attente: 1,
    livres: 1
  });
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
export const HEAD = handleProxy;
