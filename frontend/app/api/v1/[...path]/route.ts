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
    
    // Return mock PDF buffer or html preview
    const samplePdfContent = `%PDF-1.4\n% Manifeste de ramassage ${slip?.numero_bordereau || slipId}\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF`;
    
    return new NextResponse(samplePdfContent, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bordereau_${slipId}.pdf"`
      }
    });
  }

  if (path === "pickup-slips/print") {
    const samplePdfContent = `%PDF-1.4\n% Manifeste Global d'Impression H.E.S\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF`;
    
    return new NextResponse(samplePdfContent, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bordereau_impression.pdf"`
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
