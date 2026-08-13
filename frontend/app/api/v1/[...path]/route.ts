import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

// Persistent stateful mock store for offline/demo mode
let mockPickupSlips: any[] = [
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
    numero_declaration: "663300, 663307, 663314",
    pickups: [
      { id: 1, pickup_slip_id: 1, numero_declaration: "663300", client_nom: "Société Maroc Distribution", client_telephone: "+212 664 778 899", adresse: "Avenue Agdal", ville: "Rabat", nombre_colis: 18, date: "2026-08-13", heure: "09:30", observations: "Ramassage conforme" },
      { id: 2, pickup_slip_id: 1, numero_declaration: "663307", client_nom: "Electro Casa", client_telephone: "+212 667 334 455", adresse: "Derb Omar", ville: "Casablanca", nombre_colis: 15, date: "2026-08-13", heure: "11:15", observations: "Ramassage conforme" },
      { id: 3, pickup_slip_id: 1, numero_declaration: "663314", client_nom: "Fatima Zahra Mansouri", client_telephone: "+212 663 551 122", adresse: "15 Blvd Anfa", ville: "Casablanca", nombre_colis: 15, date: "2026-08-13", heure: "14:40", observations: "Ramassage conforme" }
    ]
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
    numero_declaration: "663321, 663328",
    pickups: [
      { id: 4, pickup_slip_id: 2, numero_declaration: "663321", client_nom: "Ahmed Jaremi", client_telephone: "+212 661 663 322", adresse: "Gueliz", ville: "Marrakech", nombre_colis: 12, date: "2026-08-13", heure: "10:00", observations: "Conforme" },
      { id: 5, pickup_slip_id: 2, numero_declaration: "663328", client_nom: "Boutique Oasis", client_telephone: "+212 665 112 233", adresse: "Sidi Ghanem", ville: "Marrakech", nombre_colis: 10, date: "2026-08-13", heure: "12:30", observations: "Conforme" }
    ]
  }
];

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
  
  // 1. Create Pickup Slip (POST /pickup-slips)
  if (request.method === "POST" && path === "pickup-slips") {
    try {
      const payload = await request.json();
      
      const driversList = [
        { id: 1, nom: "Kamel Mansour" },
        { id: 2, nom: "Med Ait Bouchgour" },
        { id: 3, nom: "Fares Ben Salah" },
        { id: 4, nom: "Youssef Naciri" },
        { id: 5, nom: "Rachid Alaoui" }
      ];
      const agenceList = [
        { id: 1, nom: "Agence H.E.S. Casablanca" },
        { id: 2, nom: "Agence H.E.S. Marrakech" },
        { id: 3, nom: "Agence H.E.S. Rabat" }
      ];

      const driverObj = driversList.find(d => d.id === payload.driver_id) || driversList[0];
      const agencyObj = agenceList.find(a => a.id === payload.agency_id) || agenceList[0];

      const pickups = (payload.pickups || []).map((p: any, idx: number) => ({
        id: Date.now() + idx,
        numero_declaration: p.numero_declaration || `BL-${Date.now()}`,
        client_nom: p.client_nom || "Client",
        client_telephone: p.client_telephone || null,
        adresse: p.adresse || "-",
        ville: p.ville || agencyObj.nom,
        nombre_colis: p.nombre_colis || 1,
        date: p.date || payload.date_tournee,
        heure: p.heure || "12:00",
        observations: p.observations || null
      }));

      const colis_count = pickups.reduce((sum: number, p: any) => sum + (p.nombre_colis || 0), 0);
      const client_name = pickups.map((p: any) => p.client_nom).join(", ");
      const numero_declaration = pickups.map((p: any) => p.numero_declaration).join(", ");
      
      const nextId = mockPickupSlips.length + 1;
      const dateStr = (payload.date_tournee || "20260813").replace(/-/g, "");
      const code = `BS-${dateStr}-${String(nextId).padStart(3, '0')}`;

      const newSlip = {
        id: Date.now(),
        numero_bordereau: code,
        date_tournee: payload.date_tournee || "2026-08-13",
        heure_debut: payload.heure_debut || "09:00:00",
        heure_fin: null,
        statut: "ouvert",
        created_at: new Date().toISOString(),
        driver: driverObj,
        agency: agencyObj,
        colis_count: colis_count,
        pickups_count: pickups.length,
        client_name: client_name,
        numero_declaration: numero_declaration,
        pickups: pickups
      };

      mockPickupSlips.unshift(newSlip);
      return NextResponse.json(newSlip, { status: 201 });
    } catch (e: any) {
      console.error("Create slip mock error:", e);
    }
  }

  // 2. Delete Pickup Slip (DELETE /pickup-slips/:id)
  if (request.method === "DELETE" && path.match(/pickup-slips\/\d+$/)) {
    const slipIdStr = path.split("/").pop();
    if (slipIdStr) {
      const targetId = parseInt(slipIdStr);
      mockPickupSlips = mockPickupSlips.filter(s => s.id !== targetId);
    }
    return NextResponse.json({ success: true });
  }

  // 3. PDF / Print Bordereau Fallback
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
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; }
  .header { display: flex; align-items: center; gap: 20px; border-bottom: 3px solid #dc143c; padding-bottom: 12px; margin-bottom: 20px; }
  .logo { width: 60px; height: 60px; object-fit: contain; }
  .title { color: #0047ab; font-size: 20px; font-weight: bold; margin: 0; }
  .subtitle { color: #dc143c; font-size: 11px; font-weight: bold; margin-top: 3px; letter-spacing: 1px; }
  .meta-table { width: 100%; margin-bottom: 25px; font-size: 12px; border-collapse: collapse; }
  .meta-table td { padding: 5px 0; }
  .pickups-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
  .pickups-table th { background: #0047ab; color: white; text-align: left; padding: 8px 10px; font-weight: bold; }
  .pickups-table td { border-bottom: 1px solid #cbd5e1; padding: 8px 10px; }
  .pickups-table tr:nth-child(even) { background: #f8fafc; }
  .summary-box { float: right; background: #fef3c7; border: 1px solid #fde68a; padding: 10px 16px; width: 220px; margin-bottom: 40px; font-size: 12px; font-weight: bold; border-radius: 4px; }
  .summary-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .summary-row:last-child { margin-bottom: 0; color: #0047ab; font-size: 13px; }
  .signatures { margin-top: 60px; clear: both; display: flex; justify-content: space-between; gap: 30px; }
  .sig-box { flex: 1; border: 1px solid #cbd5e1; height: 100px; padding: 10px; border-radius: 4px; }
  .sig-title { font-weight: bold; font-size: 11px; color: #0047ab; }
  .sig-sub { font-size: 10px; color: #64748b; margin-top: 4px; }
</style>
</head>
<body>
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
        <th>Colis</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><b>663300</b></td>
        <td>Société Maroc Distribution</td>
        <td>Casablanca</td>
        <td>13/08/2026</td>
        <td><b>18</b></td>
      </tr>
      <tr>
        <td><b>663307</b></td>
        <td>Electro Casa</td>
        <td>Casablanca</td>
        <td>13/08/2026</td>
        <td><b>15</b></td>
      </tr>
      <tr>
        <td><b>663314</b></td>
        <td>Fatima Zahra Mansouri</td>
        <td>Casablanca</td>
        <td>13/08/2026</td>
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

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
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

  // 4. Dashboard Stats
  if (path.includes("dashboard/stats")) {
    const totalRamassages = mockPickupSlips.reduce((sum, s) => sum + (s.pickups_count || 0), 0);
    const totalColis = mockPickupSlips.reduce((sum, s) => sum + (s.colis_count || 0), 0);

    return NextResponse.json({
      ramassages_jour: totalRamassages,
      ramassages_mois: totalColis,
      colis_par_chauffeur: [
        { driver_name: "Kamel Mansour", ramassages: 8, colis: 48 },
        { driver_name: "Med Ait Bouchgour", ramassages: 5, colis: 32 },
        { driver_name: "Fares Ben Salah", ramassages: 4, colis: 26 }
      ],
      colis_par_agence: [
        { agency_name: "Agence H.E.S. Casablanca", colis: 74 },
        { agency_name: "Agence H.E.S. Marrakech", colis: 42 },
        { agency_name: "Agence H.E.S. Rabat", colis: 26 }
      ],
      top_chauffeurs: [
        { driver_name: "Kamel Mansour", ramassages: 28, colis: 180 },
        { driver_name: "Med Ait Bouchgour", ramassages: 21, colis: 135 },
        { driver_name: "Fares Ben Salah", ramassages: 19, colis: 110 }
      ]
    });
  }

  // 5. Drivers List
  if (path.includes("drivers")) {
    return NextResponse.json([
      { id: 1, nom: "Kamel Mansour", telephone: "+212 661 01 09", agence_id: 1, actif: true, agency: { id: 1, nom: "Agence H.E.S. Casablanca" } },
      { id: 2, nom: "Med Ait Bouchgour", telephone: "+212 661 02 09", agence_id: 2, actif: true, agency: { id: 2, nom: "Agence H.E.S. Marrakech" } },
      { id: 3, nom: "Fares Ben Salah", telephone: "+212 661 03 09", agence_id: 1, actif: true, agency: { id: 1, nom: "Agence H.E.S. Casablanca" } },
      { id: 4, nom: "Youssef Naciri", telephone: "+212 661 04 09", agence_id: 2, actif: true, agency: { id: 2, nom: "Agence H.E.S. Marrakech" } },
      { id: 5, nom: "Rachid Alaoui", telephone: "+212 661 05 09", agence_id: 3, actif: true, agency: { id: 3, nom: "Agence H.E.S. Rabat" } }
    ]);
  }

  // 6. Agencies List
  if (path.includes("agences")) {
    return NextResponse.json([
      { id: 1, nom: "Agence H.E.S. Casablanca", adresse: "120 Blvd Anfa, Casablanca", telephone: "+212 522 123 456", responsable: "Hamza Al-Amri", actif: true },
      { id: 2, nom: "Agence H.E.S. Marrakech", adresse: "ZI Sidi Ghanem, Marrakech", telephone: "+212 524 654 321", responsable: "Yassine Trabelsi", actif: true },
      { id: 3, nom: "Agence H.E.S. Rabat", adresse: "Avenue Mohamed V, Rabat", telephone: "+212 537 778 899", responsable: "Sarra Benali", actif: true }
    ]);
  }

  // 7. Users List
  if (path.includes("users")) {
    return NextResponse.json([
      { id: 1, nom: "Super Admin", email: "admin@hes.com", role: "super_admin", agence_id: null, actif: true },
      { id: 2, nom: "Hamza Manager", email: "manager.casa@hes.com", role: "manager", agence_id: 1, actif: true },
      { id: 3, nom: "Agent Casablanca", email: "agent.casa@hes.com", role: "agent", agence_id: 1, actif: true }
    ]);
  }

  // 8. Search Pickups
  if (path.includes("pickups/search")) {
    const allPickups: any[] = [];
    mockPickupSlips.forEach(s => {
      (s.pickups || []).forEach((p: any) => {
        allPickups.push({
          ...p,
          driver_nom: s.driver?.nom || "-",
          agency_nom: s.agency?.nom || "-"
        });
      });
    });
    return NextResponse.json({
      items: allPickups,
      total: allPickups.length
    });
  }

  // 9. Detailed Pickup Slip (/pickup-slips/:id)
  if (path.match(/pickup-slips\/\d+$/)) {
    const slipIdStr = path.split("/").pop();
    const targetId = slipIdStr ? parseInt(slipIdStr) : null;
    const found = mockPickupSlips.find(s => s.id === targetId) || mockPickupSlips[0];
    return NextResponse.json(found);
  }

  // 10. Pickup Slips List (GET /pickup-slips)
  const totalRamassages = mockPickupSlips.reduce((sum, s) => sum + (s.pickups_count || 0), 0);
  const totalColis = mockPickupSlips.reduce((sum, s) => sum + (s.colis_count || 0), 0);
  const enAttente = mockPickupSlips.filter(s => s.statut === "ouvert").length;
  const livres = mockPickupSlips.filter(s => s.statut === "clôturé").length;

  return NextResponse.json({
    items: mockPickupSlips,
    total: mockPickupSlips.length,
    total_ramassages: totalRamassages,
    total_colis: totalColis,
    en_attente: enAttente,
    livres: livres
  });
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
export const HEAD = handleProxy;
