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
    
    const pickupsHtml = (slip?.pickups || []).map((p, i) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 10px; font-family: monospace; font-weight: bold;">${p.numero_declaration}</td>
        <td style="padding: 8px 10px; font-weight: 600;">${p.client_nom}</td>
        <td style="padding: 8px 10px; color: #475569;">${p.adresse}, ${p.ville}</td>
        <td style="padding: 8px 10px; text-align: center; font-weight: bold; font-family: monospace;">${p.nombre_colis}</td>
        <td style="padding: 8px 10px; font-family: monospace; color: #64748b;">${p.date} ${p.heure?.slice(0, 5) || ""}</td>
        <td style="padding: 8px 10px; border-left: 1px dashed #cbd5e1; height: 35px;"></td>
      </tr>
    `).join("");

    const totalColis = (slip?.pickups || []).reduce((acc, p) => acc + (p.nombre_colis || 1), 0);

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bordereau ${slip?.numero_bordereau || slipId} - H.E.S.</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 25px; color: #0f172a; background: #f8fafc; }
    .page { max-width: 800px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
    .logo-box { font-size: 22px; font-weight: 900; color: #2563eb; }
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; background: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px; }
    th { background: #e2e8f0; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
    .sig-box { border: 1px solid #cbd5e1; padding: 15px; height: 90px; border-radius: 6px; font-size: 11px; font-weight: bold; }
    .btn-bar { position: fixed; top: 15px; right: 20px; display: flex; gap: 10px; z-index: 999; }
    .print-btn { background: #2563eb; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    @media print { .btn-bar { display: none; } body { background: #fff; padding: 0; } .page { border: none; box-shadow: none; max-width: 100%; padding: 0; } }
  </style>
</head>
<body>
  <div class="btn-bar">
    <button class="print-btn" onclick="window.print()">🖨️ Imprimer / Sauvegarder PDF</button>
  </div>
  <div class="page">
    <div class="header">
      <div>
        <div class="logo-box">HORIZON EXPRESS SERVICES</div>
        <div style="font-size: 11px; color: #64748b; font-family: monospace;">MANIFESTE DE RAMASSAGE OFFICIEL</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 16px; font-weight: bold; font-family: monospace;">${slip?.numero_bordereau || `BS-#${slipId}`}</div>
        <div style="font-size: 11px; color: #64748b;">Statut : <b>${slip?.statut?.toUpperCase() || "EN COURS"}</b></div>
      </div>
    </div>
    <div class="info-grid">
      <div><span style="color:#64748b;">Chauffeur:</span><br><b>${slip?.driver?.nom || "Non assigné"}</b></div>
      <div><span style="color:#64748b;">Agence:</span><br><b>${slip?.agency?.nom || "Agence Centrale"}</b></div>
      <div><span style="color:#64748b;">Date Tournée:</span><br><b>${slip?.date_tournee || "Aujourd'hui"}</b></div>
      <div><span style="color:#64748b;">Total Colis:</span><br><b style="color: #2563eb;">${totalColis} colis (${slip?.pickups?.length || 0} ramassages)</b></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>N° BL</th>
          <th>Client</th>
          <th>Adresse / Ville</th>
          <th style="text-align: center;">Colis</th>
          <th>Date / Heure</th>
          <th style="text-align: center;">Émargement</th>
        </tr>
      </thead>
      <tbody>
        ${pickupsHtml || '<tr><td colspan="6" style="text-align:center; padding: 20px;">Aucun colis enregistré dans ce bordereau.</td></tr>'}
      </tbody>
    </table>
    <div class="signatures">
      <div class="sig-box">Signature & Émargement Chauffeur :</div>
      <div class="sig-box">Cachet & Signature Agence H.E.S. :</div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
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

    const driver = mockStore.getDrivers().find(d => d.id.toString() === driverIdParam);

    let allPickups: any[] = [];
    slips.forEach(s => {
      s.pickups.forEach(p => {
        allPickups.push({
          ...p,
          numero_bordereau: s.numero_bordereau,
          driver_nom: s.driver?.nom || driver?.nom || "Chauffeur",
          agency_nom: s.agency?.nom || "Agence Centrale"
        });
      });
    });

    const totalColis = allPickups.reduce((acc, p) => acc + (p.nombre_colis || 1), 0);

    const rowsHtml = allPickups.map(p => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 7px 10px; font-family: monospace; font-weight: bold;">${p.numero_declaration}</td>
        <td style="padding: 7px 10px; font-family: monospace; font-size: 11px; color: #64748b;">${p.numero_bordereau}</td>
        <td style="padding: 7px 10px; font-weight: 600;">${p.client_nom}</td>
        <td style="padding: 7px 10px; color: #475569;">${p.adresse}, ${p.ville}</td>
        <td style="padding: 7px 10px; text-align: center; font-weight: bold; font-family: monospace;">${p.nombre_colis}</td>
        <td style="padding: 7px 10px; font-family: monospace; font-size: 11px;">${p.date}</td>
        <td style="padding: 7px 10px; border-left: 1px dashed #cbd5e1; height: 35px;"></td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Feuille d'Émargement H.E.S. - ${driver?.nom || 'Tournée'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 25px; color: #0f172a; background: #f8fafc; }
    .page { max-width: 850px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
    .logo-box { font-size: 22px; font-weight: 900; color: #2563eb; }
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; background: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px; }
    th { background: #e2e8f0; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
    .sig-box { border: 1px solid #cbd5e1; padding: 15px; height: 90px; border-radius: 6px; font-size: 11px; font-weight: bold; }
    .btn-bar { position: fixed; top: 15px; right: 20px; display: flex; gap: 10px; z-index: 999; }
    .print-btn { background: #2563eb; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    @media print { .btn-bar { display: none; } body { background: #fff; padding: 0; } .page { border: none; box-shadow: none; max-width: 100%; padding: 0; } }
  </style>
</head>
<body>
  <div class="btn-bar">
    <button class="print-btn" onclick="window.print()">🖨️ Imprimer / Sauvegarder PDF</button>
  </div>
  <div class="page">
    <div class="header">
      <div>
        <div class="logo-box">HORIZON EXPRESS SERVICES</div>
        <div style="font-size: 11px; color: #64748b; font-family: monospace;">FEUILLE D'ÉMARGEMENT & MANIFESTE DE TOURNÉE</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 13px; font-weight: bold; font-family: monospace;">DOCUMENT OFFICIEL</div>
        <div style="font-size: 11px; color: #64748b;">Édité le : ${new Date().toLocaleDateString("fr-FR")}</div>
      </div>
    </div>
    <div class="info-grid">
      <div><span style="color:#64748b;">Chauffeur:</span><br><b>${driver ? driver.nom : "Tous les chauffeurs"}</b></div>
      <div><span style="color:#64748b;">Agence:</span><br><b>${driver?.agency?.nom || "Réseau National"}</b></div>
      <div><span style="color:#64748b;">Période:</span><br><b>${dateDebutParam || "Début"} au ${dateFinParam || "Aujourd'hui"}</b></div>
      <div><span style="color:#64748b;">Total Colis:</span><br><b style="color: #2563eb;">${totalColis} colis (${allPickups.length} déclarations)</b></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>N° BL</th>
          <th>N° Bordereau</th>
          <th>Client</th>
          <th>Adresse / Ville</th>
          <th style="text-align: center;">Colis</th>
          <th>Date</th>
          <th style="text-align: center;">Émargement Client</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="7" style="text-align:center; padding: 20px;">Aucun ramassage pour cette sélection.</td></tr>'}
      </tbody>
      <tfoot>
        <tr style="background: #f1f5f9; font-weight: bold;">
          <td colspan="4" style="padding: 10px; text-align: right;">TOTAL GÉNÉRAL :</td>
          <td style="padding: 10px; text-align: center; color: #2563eb;">${totalColis}</td>
          <td colspan="2" style="padding: 10px; text-align: right; color: #64748b;">${allPickups.length} ramassages</td>
        </tr>
      </tfoot>
    </table>
    <div class="signatures">
      <div class="sig-box">Signature du Chauffeur :</div>
      <div class="sig-box">Cachet & Signature Agence H.E.S. :</div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
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
