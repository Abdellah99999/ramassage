import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "../../../../lib/mockData";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const path = params.path.join("/");
  const searchParams = request.nextUrl.searchParams;

  // 1. Dashboard Stats
  if (path === "dashboard/stats") {
    return NextResponse.json(mockStore.getDashboardStats());
  }

  // 2. Pickup Slips Drivers & Agencies list
  if (path === "pickup-slips/drivers") {
    return NextResponse.json(mockStore.getDrivers());
  }
  if (path === "pickup-slips/agences") {
    return NextResponse.json(mockStore.getAgencies());
  }

  // 3. Search Pickups
  if (path === "pickup-slips/pickups/search") {
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const numero_declaration = searchParams.get("numero_declaration") || undefined;
    const client = searchParams.get("client") || undefined;
    const ville = searchParams.get("ville") || undefined;
    const driver_id = searchParams.get("driver_id") || undefined;
    const agency_id = searchParams.get("agency_id") || undefined;
    const date_pick = searchParams.get("date_pick") || undefined;

    return NextResponse.json(
      mockStore.searchPickups({
        skip,
        limit,
        numero_declaration,
        client,
        ville,
        driver_id,
        agency_id,
        date_pick,
      })
    );
  }

  // 4. Pickup Slips PDF download / Print Preview
  if (path.startsWith("pickup-slips/") && path.endsWith("/pdf")) {
    const slipId = parseInt(path.split("/")[1]);
    const slip = mockStore.getPickupSlipById(slipId);
    const driver = slip?.driver;
    const agency = slip?.agency;
    
    const pickups = slip?.pickups || [];
    const totalRamassages = pickups.length;
    const totalColis = pickups.reduce((acc, p) => acc + (p.nombre_colis || 1), 0);

    const rowsHtml = pickups.map((p, idx) => `
      <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 12px; font-family: monospace; font-size: 12px; font-weight: 600;">${p.numero_declaration}</td>
        <td style="padding: 8px 12px; font-size: 12px;">${p.client_nom}</td>
        <td style="padding: 8px 12px; font-size: 12px;">${p.ville}</td>
        <td style="padding: 8px 12px; font-size: 12px;">${p.date}</td>
        <td style="padding: 8px 12px; font-size: 12px;">${p.heure?.slice(0, 5) || "09:00"}</td>
        <td style="padding: 8px 12px; font-size: 12px; text-align: center; font-weight: bold;">${p.nombre_colis}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bordereau ${slip?.numero_bordereau || slipId} - H.E.S.</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 40px 20px; color: #1e293b; background: #525659; }
    .page { max-width: 780px; margin: 0 auto; background: #fff; padding: 40px 45px; min-height: 1000px; box-sizing: border-box; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .header { display: flex; align-items: center; gap: 20px; margin-bottom: 12px; }
    .logo { height: 60px; width: auto; object-fit: contain; }
    .title-box h1 { font-size: 20px; font-weight: 800; color: #112d4e; margin: 0 0 4px 0; letter-spacing: 0.5px; }
    .title-box h2 { font-size: 13.5px; font-weight: 700; color: #112d4e; margin: 0; }
    .divider { height: 2.5px; background-color: #112d4e; width: 100%; margin: 12px 0 20px 0; }
    .meta-grid { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 12.5px; line-height: 1.8; color: #334155; }
    .meta-grid strong { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th { background: #112d4e; color: #ffffff; padding: 9px 12px; text-align: left; font-size: 11.5px; font-weight: 700; letter-spacing: 0.3px; }
    .totals-container { display: flex; justify-content: flex-end; margin-bottom: 35px; }
    .totals-box { background: #fdfbe8; border: 1px solid #f3ebb8; width: 220px; font-size: 12px; border-collapse: collapse; }
    .totals-box td { padding: 8px 12px; }
    .totals-box tr:first-child { border-bottom: 1px solid #f3ebb8; }
    .totals-box .label { font-weight: 700; color: #1e293b; font-size: 11px; }
    .totals-box .val { text-align: right; font-weight: 800; font-size: 13px; color: #0f172a; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .sig-box { border: 1px solid #cbd5e1; height: 110px; padding: 12px 14px; box-sizing: border-box; }
    .sig-title { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
    .sig-sub { font-size: 11px; color: #64748b; }
    .btn-bar { position: fixed; top: 15px; right: 20px; display: flex; gap: 10px; z-index: 999; }
    .print-btn { background: #112d4e; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 13px; }
    .print-btn:hover { background: #1e4976; }
    @media print { .btn-bar { display: none !important; } body { background: #fff !important; padding: 0 !important; } .page { box-shadow: none !important; padding: 20px 0 !important; max-width: 100% !important; } }
  </style>
</head>
<body>
  <div class="btn-bar">
    <button class="print-btn" onclick="window.print()">🖨️ Imprimer / Sauvegarder en PDF</button>
  </div>
  <div class="page">
    <div class="header">
      <img src="/logo.png" alt="H.E.S Logo" class="logo" />
      <div class="title-box">
        <h1>HORIZON EXPRESS SERVICES</h1>
        <h2>BORDEREAU RÉCAPITULATIF DE RAMASSAGE</h2>
      </div>
    </div>
    <div class="divider"></div>
    <div class="meta-grid">
      <div>
        <div><strong>Chauffeur :</strong> ${driver?.nom || "Non assigné"}</div>
        <div><strong>Téléphone :</strong> ${driver ? (mockStore.getDrivers().find(d => d.id === driver.id)?.telephone || "+212 661 00 00") : "98 111 222"}</div>
      </div>
      <div>
        <div><strong>Agence :</strong> ${agency?.nom || "Agence H.E.S. Centrale"}</div>
        <div><strong>Période :</strong> ${slip?.date_tournee || new Date().toISOString().split("T")[0]}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>N° BL</th>
          <th>Client</th>
          <th>Ville</th>
          <th>Date</th>
          <th>Heure</th>
          <th style="text-align: center;">Colis</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding: 20px;">Aucun colis enregistré dans ce bordereau.</td></tr>'}
      </tbody>
    </table>
    <div class="totals-container">
      <table class="totals-box">
        <tr>
          <td class="label">TOTAL RAMASSAGES :</td>
          <td class="val">${totalRamassages}</td>
        </tr>
        <tr>
          <td class="label">TOTAL COLIS :</td>
          <td class="val">${totalColis}</td>
        </tr>
      </table>
    </div>
    <div class="signatures">
      <div class="sig-box">
        <div class="sig-title">Signature Responsable</div>
        <div class="sig-sub">Horizon Express Services</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Signature Chauffeur</div>
        <div class="sig-sub">Émargement et accord</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  if (path === "pickup-slips/print") {
    const driverIdParam = searchParams.get("driver_id");
    const dateDebutParam = searchParams.get("date_debut") || "";
    const dateFinParam = searchParams.get("date_fin") || "";
    
    let slips = mockStore.getPickupSlips({ limit: 50 }).items;
    if (driverIdParam) {
      slips = slips.filter(s => s.driver_id.toString() === driverIdParam);
    }

    const driver = mockStore.getDrivers().find(d => d.id.toString() === driverIdParam) || mockStore.getDrivers()[0];

    let allPickups: any[] = [];
    slips.forEach(s => {
      s.pickups.forEach(p => {
        allPickups.push({
          ...p,
          numero_bordereau: s.numero_bordereau,
          driver_nom: s.driver?.nom || driver?.nom || "Chauffeur",
          agency_nom: s.agency?.nom || driver?.agency?.nom || "Agence H.E.S."
        });
      });
    });

    const totalRamassages = allPickups.length;
    const totalColis = allPickups.reduce((acc, p) => acc + (p.nombre_colis || 1), 0);

    const rowsHtml = allPickups.map((p, idx) => `
      <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 12px; font-family: monospace; font-size: 12px; font-weight: 600;">${p.numero_declaration}</td>
        <td style="padding: 8px 12px; font-size: 12px;">${p.client_nom}</td>
        <td style="padding: 8px 12px; font-size: 12px;">${p.ville}</td>
        <td style="padding: 8px 12px; font-size: 12px;">${p.date}</td>
        <td style="padding: 8px 12px; font-size: 12px;">${p.heure?.slice(0, 5) || "09:00"}</td>
        <td style="padding: 8px 12px; font-size: 12px; text-align: center; font-weight: bold;">${p.nombre_colis}</td>
      </tr>
    `).join("");

    const formatFr = (dStr: string) => {
      if (!dStr) return "";
      const parts = dStr.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dStr;
    };

    const periodeText = dateDebutParam && dateFinParam 
      ? `Du ${formatFr(dateDebutParam)} au ${formatFr(dateFinParam)}`
      : "Tournée du jour";

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bordereau Récapitulatif - ${driver ? driver.nom : 'H.E.S.'}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 40px 20px; color: #1e293b; background: #525659; }
    .page { max-width: 780px; margin: 0 auto; background: #fff; padding: 40px 45px; min-height: 1000px; box-sizing: border-box; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .header { display: flex; align-items: center; gap: 20px; margin-bottom: 12px; }
    .logo { height: 60px; width: auto; object-fit: contain; }
    .title-box h1 { font-size: 20px; font-weight: 800; color: #112d4e; margin: 0 0 4px 0; letter-spacing: 0.5px; }
    .title-box h2 { font-size: 13.5px; font-weight: 700; color: #112d4e; margin: 0; }
    .divider { height: 2.5px; background-color: #112d4e; width: 100%; margin: 12px 0 20px 0; }
    .meta-grid { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 12.5px; line-height: 1.8; color: #334155; }
    .meta-grid strong { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th { background: #112d4e; color: #ffffff; padding: 9px 12px; text-align: left; font-size: 11.5px; font-weight: 700; letter-spacing: 0.3px; }
    .totals-container { display: flex; justify-content: flex-end; margin-bottom: 35px; }
    .totals-box { background: #fdfbe8; border: 1px solid #f3ebb8; width: 220px; font-size: 12px; border-collapse: collapse; }
    .totals-box td { padding: 8px 12px; }
    .totals-box tr:first-child { border-bottom: 1px solid #f3ebb8; }
    .totals-box .label { font-weight: 700; color: #1e293b; font-size: 11px; }
    .totals-box .val { text-align: right; font-weight: 800; font-size: 13px; color: #0f172a; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .sig-box { border: 1px solid #cbd5e1; height: 110px; padding: 12px 14px; box-sizing: border-box; }
    .sig-title { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
    .sig-sub { font-size: 11px; color: #64748b; }
    .btn-bar { position: fixed; top: 15px; right: 20px; display: flex; gap: 10px; z-index: 999; }
    .print-btn { background: #112d4e; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 13px; }
    .print-btn:hover { background: #1e4976; }
    @media print { .btn-bar { display: none !important; } body { background: #fff !important; padding: 0 !important; } .page { box-shadow: none !important; padding: 20px 0 !important; max-width: 100% !important; } }
  </style>
</head>
<body>
  <div class="btn-bar">
    <button class="print-btn" onclick="window.print()">🖨️ Imprimer / Sauvegarder en PDF</button>
  </div>
  <div class="page">
    <div class="header">
      <img src="/logo.png" alt="H.E.S Logo" class="logo" />
      <div class="title-box">
        <h1>HORIZON EXPRESS SERVICES</h1>
        <h2>BORDEREAU RÉCAPITULATIF DE RAMASSAGE</h2>
      </div>
    </div>
    <div class="divider"></div>
    <div class="meta-grid">
      <div>
        <div><strong>Chauffeur :</strong> ${driver ? driver.nom : "Kamel Mansour"}</div>
        <div><strong>Téléphone :</strong> ${driver ? (driver.telephone || "+212 661 10 19") : "98 111 222"}</div>
      </div>
      <div>
        <div><strong>Agence :</strong> ${driver?.agency?.nom || "Agence H.E.S. Centrale"}</div>
        <div><strong>Période :</strong> ${periodeText}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>N° BL</th>
          <th>Client</th>
          <th>Ville</th>
          <th>Date</th>
          <th>Heure</th>
          <th style="text-align: center;">Colis</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding: 20px;">Aucun ramassage trouvé pour cette sélection.</td></tr>'}
      </tbody>
    </table>
    <div class="totals-container">
      <table class="totals-box">
        <tr>
          <td class="label">TOTAL RAMASSAGES :</td>
          <td class="val">${totalRamassages}</td>
        </tr>
        <tr>
          <td class="label">TOTAL COLIS :</td>
          <td class="val">${totalColis}</td>
        </tr>
      </table>
    </div>
    <div class="signatures">
      <div class="sig-box">
        <div class="sig-title">Signature Responsable</div>
        <div class="sig-sub">Horizon Express Services</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Signature Chauffeur</div>
        <div class="sig-sub">Émargement et accord</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  // 5. Pickup Slips List or Detail
  if (path === "pickup-slips") {
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const driver_id = searchParams.get("driver_id") || undefined;
    const agency_id = searchParams.get("agency_id") || undefined;
    const statut = searchParams.get("statut") || undefined;
    const date_tournee = searchParams.get("date_tournee") || undefined;

    return NextResponse.json(
      mockStore.getPickupSlips({
        skip,
        limit,
        driver_id,
        agency_id,
        statut,
        date_tournee,
      })
    );
  }

  if (path.startsWith("pickup-slips/")) {
    const slipId = parseInt(path.split("/")[1]);
    const slip = mockStore.getPickupSlipById(slipId);
    if (!slip) {
      return NextResponse.json({ detail: "Bordereau non trouvé" }, { status: 404 });
    }
    return NextResponse.json(slip);
  }

  // 6. Agences CRUD
  if (path === "agences-crud") {
    return NextResponse.json(mockStore.getAgencies());
  }

  // 7. Drivers CRUD
  if (path === "drivers-crud") {
    return NextResponse.json(mockStore.getDrivers());
  }

  // 8. Users CRUD
  if (path === "users") {
    return NextResponse.json(mockStore.getUsers());
  }

  return NextResponse.json({ detail: "Not found" }, { status: 404 });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const path = params.path.join("/");
  const body = await request.json().catch(() => ({}));

  if (path === "pickup-slips") {
    const created = mockStore.createPickupSlip(body);
    return NextResponse.json(created, { status: 201 });
  }

  if (path.startsWith("pickup-slips/") && path.endsWith("/pickups")) {
    const slipId = parseInt(path.split("/")[1]);
    const pickup = mockStore.addPickupToSlip(slipId, body);
    return NextResponse.json(pickup, { status: 201 });
  }

  if (path.startsWith("pickup-slips/") && path.endsWith("/close")) {
    const slipId = parseInt(path.split("/")[1]);
    const closed = mockStore.closePickupSlip(slipId);
    return NextResponse.json(closed, { status: 200 });
  }

  if (path === "agences-crud") {
    const agency = mockStore.createAgency(body);
    return NextResponse.json(agency, { status: 201 });
  }

  if (path === "drivers-crud") {
    const driver = mockStore.createDriver(body);
    return NextResponse.json(driver, { status: 201 });
  }

  if (path === "users") {
    const user = mockStore.createUser(body);
    return NextResponse.json(user, { status: 201 });
  }

  return NextResponse.json({ detail: "Action not supported" }, { status: 400 });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const path = params.path.join("/");
  const body = await request.json().catch(() => ({}));

  if (path.startsWith("pickup-slips/")) {
    const slipId = parseInt(path.split("/")[1]);
    const updated = mockStore.updatePickupSlip(slipId, body);
    return NextResponse.json(updated, { status: 200 });
  }

  if (path.startsWith("agences-crud/")) {
    const agencyId = parseInt(path.split("/")[1]);
    const updated = mockStore.updateAgency(agencyId, body);
    return NextResponse.json(updated, { status: 200 });
  }

  if (path.startsWith("drivers-crud/")) {
    const driverId = parseInt(path.split("/")[1]);
    const updated = mockStore.updateDriver(driverId, body);
    return NextResponse.json(updated, { status: 200 });
  }

  if (path.startsWith("users/")) {
    const userId = parseInt(path.split("/")[1]);
    const updated = mockStore.updateUser(userId, body);
    return NextResponse.json(updated, { status: 200 });
  }

  return NextResponse.json({ detail: "Action not supported" }, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const path = params.path.join("/");

  if (path.startsWith("pickup-slips/")) {
    const slipId = parseInt(path.split("/")[1]);
    mockStore.deletePickupSlip(slipId);
    return new NextResponse(null, { status: 204 });
  }

  if (path.startsWith("agences-crud/")) {
    const agencyId = parseInt(path.split("/")[1]);
    mockStore.deleteAgency(agencyId);
    return new NextResponse(null, { status: 204 });
  }

  if (path.startsWith("drivers-crud/")) {
    const driverId = parseInt(path.split("/")[1]);
    mockStore.deleteDriver(driverId);
    return new NextResponse(null, { status: 204 });
  }

  if (path.startsWith("users/")) {
    const userId = parseInt(path.split("/")[1]);
    mockStore.deleteUser(userId);
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json({ detail: "Action not supported" }, { status: 400 });
}
