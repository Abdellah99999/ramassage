export interface MockAgency {
  id: number;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  responsable: string | null;
  ville?: string;
  actif: boolean;
}

export interface MockUser {
  id: number;
  nom: string;
  email: string;
  role: string;
  agence_id: number | null;
  actif: boolean;
  password?: string;
  agency?: { id: number; nom: string; ville?: string } | null;
}

export interface MockDriver {
  id: number;
  nom: string;
  telephone: string | null;
  agence_id: number;
  actif: boolean;
  agency?: { id: number; nom: string } | null;
}

export interface MockPickup {
  id: number;
  pickup_slip_id: number;
  numero_declaration: string;
  client_nom: string;
  client_telephone: string | null;
  adresse: string;
  ville: string;
  nombre_colis: number;
  date: string;
  heure: string;
  observations: string | null;
}

export interface MockPickupSlip {
  id: number;
  numero_bordereau: string;
  driver_id: number;
  agency_id: number;
  date_tournee: string;
  heure_debut: string;
  heure_fin: string | null;
  statut: string;
  created_at: string;
  driver: { id: number; nom: string };
  agency: { id: number; nom: string };
  colis_count: number;
  pickups_count: number;
  client_name?: string;
  numero_declaration?: string;
  pickups: MockPickup[];
}

export const INITIAL_AGENCIES: MockAgency[] = [
  { id: 1, nom: "Agence H.E.S. Casablanca", adresse: "120 Boulevard d'Anfa, Casablanca", telephone: "+212 522 123 456", responsable: "Hamza Al-Amri", ville: "Casablanca", actif: true },
  { id: 2, nom: "Agence H.E.S. Marrakech", adresse: "Zone Industrielle Sidi Ghanem, Marrakech", telephone: "+212 524 654 321", responsable: "Yassine Trabelsi", ville: "Marrakech", actif: true },
  { id: 3, nom: "Agence H.E.S. Rabat", adresse: "Avenue Mohamed V, Agdal, Rabat", telephone: "+212 537 778 899", responsable: "Sarra Benali", ville: "Rabat", actif: true },
  { id: 4, nom: "Agence H.E.S. Tanger", adresse: "Zone Franche Tanger Med, Tanger", telephone: "+212 539 334 455", responsable: "Omar Kabbaj", ville: "Tanger", actif: true },
  { id: 5, nom: "Agence H.E.S. Agadir", adresse: "Boulevard Hassan II, Agadir", telephone: "+212 528 889 900", responsable: "Karim El Idrissi", ville: "Agadir", actif: true },
];

export const INITIAL_USERS: MockUser[] = [
  { id: 1, nom: "Super Admin", email: "admin@hes.com", role: "super_admin", agence_id: null, actif: true, password: "admin123" },
  { id: 2, nom: "Hamza Manager (Casa)", email: "manager.casa@hes.com", role: "manager", agence_id: 1, actif: true, password: "admin123", agency: { id: 1, nom: "Agence H.E.S. Casablanca", ville: "Casablanca" } },
  { id: 3, nom: "Yassine Manager (Kech)", email: "manager.kech@hes.com", role: "manager", agence_id: 2, actif: true, password: "admin123", agency: { id: 2, nom: "Agence H.E.S. Marrakech", ville: "Marrakech" } },
  { id: 4, nom: "Agent Casablanca", email: "agent.casa@hes.com", role: "agent", agence_id: 1, actif: true, password: "admin123", agency: { id: 1, nom: "Agence H.E.S. Casablanca", ville: "Casablanca" } },
  { id: 5, nom: "Agent Marrakech", email: "agent.kech@hes.com", role: "agent", agence_id: 2, actif: true, password: "admin123", agency: { id: 2, nom: "Agence H.E.S. Marrakech", ville: "Marrakech" } },
];

export const INITIAL_DRIVERS: MockDriver[] = [
  { id: 1, nom: "Kamel Mansour", telephone: "+212 661 10 19", agence_id: 5, actif: true, agency: { id: 5, nom: "Agence H.E.S. Agadir" } },
  { id: 2, nom: "Med Ait Bouchgour", telephone: "+212 661 20 29", agence_id: 2, actif: true, agency: { id: 2, nom: "Agence H.E.S. Marrakech" } },
  { id: 3, nom: "Fares Ben Salah", telephone: "+212 661 30 39", agence_id: 1, actif: true, agency: { id: 1, nom: "Agence H.E.S. Casablanca" } },
  { id: 4, nom: "Youssef Naciri", telephone: "+212 661 40 49", agence_id: 2, actif: true, agency: { id: 2, nom: "Agence H.E.S. Marrakech" } },
  { id: 5, nom: "Rachid Alaoui", telephone: "+212 661 50 59", agence_id: 3, actif: true, agency: { id: 3, nom: "Agence H.E.S. Rabat" } },
  { id: 6, nom: "Tariq Zaidi", telephone: "+212 661 60 69", agence_id: 4, actif: true, agency: { id: 4, nom: "Agence H.E.S. Tanger" } },
  { id: 7, nom: "Amine Chraibi", telephone: "+212 661 70 79", agence_id: 5, actif: true, agency: { id: 5, nom: "Agence H.E.S. Agadir" } },
];

const INITIAL_SLIPS_RAW: MockPickupSlip[] = [
  {
    id: 1,
    numero_bordereau: "BS-20260814-001",
    driver_id: 3,
    agency_id: 1,
    date_tournee: "2026-08-14",
    heure_debut: "08:30:00",
    heure_fin: null,
    statut: "en_cours",
    created_at: "2026-08-14T08:30:00Z",
    driver: { id: 3, nom: "Fares Ben Salah" },
    agency: { id: 1, nom: "Agence H.E.S. Casablanca" },
    colis_count: 12,
    pickups_count: 3,
    client_name: "Maroc Telecom",
    numero_declaration: "BL-1001",
    pickups: [
      { id: 1, pickup_slip_id: 1, numero_declaration: "BL-1001", client_nom: "Maroc Telecom", client_telephone: "+212 661 00 11", adresse: "120 Bd Zerktouni", ville: "Casablanca", nombre_colis: 4, date: "2026-08-14", heure: "09:15:00", observations: "Prioritaire" },
      { id: 2, pickup_slip_id: 1, numero_declaration: "BL-1002", client_nom: "Electroplanet Anfa", client_telephone: "+212 661 00 22", adresse: "Bd d'Anfa", ville: "Casablanca", nombre_colis: 5, date: "2026-08-14", heure: "10:30:00", observations: "Fragile" },
      { id: 3, pickup_slip_id: 1, numero_declaration: "BL-1003", client_nom: "LabelVie Express", client_telephone: "+212 661 00 33", adresse: "Route d'El Jadida", ville: "Casablanca", nombre_colis: 3, date: "2026-08-14", heure: "11:45:00", observations: null },
    ]
  },
  {
    id: 2,
    numero_bordereau: "BS-20260814-002",
    driver_id: 2,
    agency_id: 2,
    date_tournee: "2026-08-14",
    heure_debut: "08:45:00",
    heure_fin: null,
    statut: "en_cours",
    created_at: "2026-08-14T08:45:00Z",
    driver: { id: 2, nom: "Med Ait Bouchgour" },
    agency: { id: 2, nom: "Agence H.E.S. Marrakech" },
    colis_count: 8,
    pickups_count: 2,
    client_name: "Marjane Menara",
    numero_declaration: "BL-1004",
    pickups: [
      { id: 4, pickup_slip_id: 2, numero_declaration: "BL-1004", client_nom: "Marjane Menara", client_telephone: "+212 661 00 44", adresse: "Avenue Guemassa", ville: "Marrakech", nombre_colis: 5, date: "2026-08-14", heure: "09:40:00", observations: "Livraison express" },
      { id: 5, pickup_slip_id: 2, numero_declaration: "BL-1005", client_nom: "Decathlon Gueliz", client_telephone: "+212 661 00 55", adresse: "Avenue Abdelkrim Khattabi", ville: "Marrakech", nombre_colis: 3, date: "2026-08-14", heure: "11:15:00", observations: null },
    ]
  },
  {
    id: 3,
    numero_bordereau: "BS-20260813-003",
    driver_id: 5,
    agency_id: 3,
    date_tournee: "2026-08-13",
    heure_debut: "08:00:00",
    heure_fin: "17:30:00",
    statut: "clôturé",
    created_at: "2026-08-13T08:00:00Z",
    driver: { id: 5, nom: "Rachid Alaoui" },
    agency: { id: 3, nom: "Agence H.E.S. Rabat" },
    colis_count: 15,
    pickups_count: 3,
    client_name: "Maroc Telecom Agdal",
    numero_declaration: "BL-1006",
    pickups: [
      { id: 6, pickup_slip_id: 3, numero_declaration: "BL-1006", client_nom: "Maroc Telecom Agdal", client_telephone: "+212 661 00 66", adresse: "Avenue Annakhil", ville: "Rabat", nombre_colis: 6, date: "2026-08-13", heure: "09:30:00", observations: null },
      { id: 7, pickup_slip_id: 3, numero_declaration: "BL-1007", client_nom: "Kitea Rabat", client_telephone: "+212 661 00 77", adresse: "Avenue Hassan II", ville: "Rabat", nombre_colis: 5, date: "2026-08-13", heure: "11:20:00", observations: "Fragile" },
      { id: 8, pickup_slip_id: 3, numero_declaration: "BL-1008", client_nom: "Pharmacie Centrale", client_telephone: "+212 661 00 88", adresse: "Boulevard Fal Ould Oumeir", ville: "Rabat", nombre_colis: 4, date: "2026-08-13", heure: "14:10:00", observations: "Urgent" },
    ]
  },
  {
    id: 4,
    numero_bordereau: "BS-20260812-004",
    driver_id: 6,
    agency_id: 4,
    date_tournee: "2026-08-12",
    heure_debut: "08:15:00",
    heure_fin: "16:45:00",
    statut: "clôturé",
    created_at: "2026-08-12T08:15:00Z",
    driver: { id: 6, nom: "Tariq Zaidi" },
    agency: { id: 4, nom: "Agence H.E.S. Tanger" },
    colis_count: 9,
    pickups_count: 2,
    client_name: "Kitea City Tanger",
    numero_declaration: "BL-1009",
    pickups: [
      { id: 9, pickup_slip_id: 4, numero_declaration: "BL-1009", client_nom: "Kitea City Tanger", client_telephone: "+212 661 00 99", adresse: "Route de Tétouan", ville: "Tanger", nombre_colis: 5, date: "2026-08-12", heure: "10:00:00", observations: null },
      { id: 10, pickup_slip_id: 4, numero_declaration: "BL-1010", client_nom: "Renault Tanger Med", client_telephone: "+212 661 01 00", adresse: "Zone Franche", ville: "Tanger", nombre_colis: 4, date: "2026-08-12", heure: "13:30:00", observations: "Colis industriels" },
    ]
  },
  {
    id: 5,
    numero_bordereau: "BS-20260811-005",
    driver_id: 1,
    agency_id: 5,
    date_tournee: "2026-08-11",
    heure_debut: "08:00:00",
    heure_fin: "17:00:00",
    statut: "clôturé",
    created_at: "2026-08-11T08:00:00Z",
    driver: { id: 1, nom: "Kamel Mansour" },
    agency: { id: 5, nom: "Agence H.E.S. Agadir" },
    colis_count: 14,
    pickups_count: 2,
    client_name: "BIM Stores Agadir",
    numero_declaration: "BL-1011",
    pickups: [
      { id: 11, pickup_slip_id: 5, numero_declaration: "BL-1011", client_nom: "BIM Stores Agadir", client_telephone: "+212 661 01 11", adresse: "Zone Industrielle Tassila", ville: "Agadir", nombre_colis: 8, date: "2026-08-11", heure: "09:30:00", observations: null },
      { id: 12, pickup_slip_id: 5, numero_declaration: "BL-1012", client_nom: "Coopérative Argania", client_telephone: "+212 661 01 22", adresse: "Avenue Hassan I", ville: "Agadir", nombre_colis: 6, date: "2026-08-11", heure: "12:00:00", observations: "Fragile" },
    ]
  }
];

// Global in-memory storage for autonomous frontend execution on Vercel
let globalAgencies = [...INITIAL_AGENCIES];
let globalUsers = [...INITIAL_USERS];
let globalDrivers = [...INITIAL_DRIVERS];
let globalSlips = [...INITIAL_SLIPS_RAW];

export const mockStore = {
  getAgencies: () => globalAgencies,
  createAgency: (data: Partial<MockAgency>) => {
    const newId = globalAgencies.length ? Math.max(...globalAgencies.map(a => a.id)) + 1 : 1;
    const newAgency: MockAgency = {
      id: newId,
      nom: data.nom || "Nouvelle Agence",
      adresse: data.adresse || null,
      telephone: data.telephone || null,
      responsable: data.responsable || null,
      actif: data.actif ?? true,
    };
    globalAgencies.push(newAgency);
    return newAgency;
  },
  updateAgency: (id: number, data: Partial<MockAgency>) => {
    const idx = globalAgencies.findIndex(a => a.id === id);
    if (idx >= 0) {
      globalAgencies[idx] = { ...globalAgencies[idx], ...data };
      return globalAgencies[idx];
    }
    return null;
  },
  deleteAgency: (id: number) => {
    globalAgencies = globalAgencies.filter(a => a.id !== id);
    return true;
  },

  getUsers: () => globalUsers,
  createUser: (data: Partial<MockUser>) => {
    const newId = globalUsers.length ? Math.max(...globalUsers.map(u => u.id)) + 1 : 1;
    const agency = globalAgencies.find(a => a.id === data.agence_id);
    const newUser: MockUser = {
      id: newId,
      nom: data.nom || "Nouvel Utilisateur",
      email: data.email || `user${newId}@hes.com`,
      role: data.role || "agent",
      agence_id: data.agence_id || null,
      actif: data.actif ?? true,
      password: data.password || "admin123",
      agency: agency ? { id: agency.id, nom: agency.nom } : null
    };
    globalUsers.push(newUser);
    return newUser;
  },
  updateUser: (id: number, data: Partial<MockUser>) => {
    const idx = globalUsers.findIndex(u => u.id === id);
    if (idx >= 0) {
      const agency = data.agence_id ? globalAgencies.find(a => a.id === data.agence_id) : globalUsers[idx].agency;
      globalUsers[idx] = {
        ...globalUsers[idx],
        ...data,
        agency: agency ? { id: agency.id, nom: agency.nom } : null
      };
      return globalUsers[idx];
    }
    return null;
  },
  deleteUser: (id: number) => {
    globalUsers = globalUsers.filter(u => u.id !== id);
    return true;
  },

  getDrivers: () => globalDrivers,
  createDriver: (data: Partial<MockDriver>) => {
    const newId = globalDrivers.length ? Math.max(...globalDrivers.map(d => d.id)) + 1 : 1;
    const agency = globalAgencies.find(a => a.id === data.agence_id);
    const newDriver: MockDriver = {
      id: newId,
      nom: data.nom || "Nouveau Chauffeur",
      telephone: data.telephone || null,
      agence_id: data.agence_id || 1,
      actif: data.actif ?? true,
      agency: agency ? { id: agency.id, nom: agency.nom } : null
    };
    globalDrivers.push(newDriver);
    return newDriver;
  },
  updateDriver: (id: number, data: Partial<MockDriver>) => {
    const idx = globalDrivers.findIndex(d => d.id === id);
    if (idx >= 0) {
      const agency = data.agence_id ? globalAgencies.find(a => a.id === data.agence_id) : globalDrivers[idx].agency;
      globalDrivers[idx] = {
        ...globalDrivers[idx],
        ...data,
        agency: agency ? { id: agency.id, nom: agency.nom } : null
      };
      return globalDrivers[idx];
    }
    return null;
  },
  deleteDriver: (id: number) => {
    globalDrivers = globalDrivers.filter(d => d.id !== id);
    return true;
  },

  getPickupSlips: (filters?: { skip?: number; limit?: number; driver_id?: string; agency_id?: string; statut?: string; date_tournee?: string }) => {
    let items = [...globalSlips];
    if (filters?.driver_id) {
      items = items.filter(s => s.driver_id.toString() === filters.driver_id);
    }
    if (filters?.agency_id) {
      items = items.filter(s => s.agency_id.toString() === filters.agency_id);
    }
    if (filters?.statut) {
      items = items.filter(s => s.statut === filters.statut);
    }
    if (filters?.date_tournee) {
      items = items.filter(s => s.date_tournee === filters.date_tournee);
    }

    const total = items.length;
    const total_ramassages = items.reduce((acc, curr) => acc + (curr.pickups_count || 0), 0);
    const total_colis = items.reduce((acc, curr) => acc + (curr.colis_count || 0), 0);
    const en_attente = items.filter(s => s.statut === "en_cours").length;
    const livres = items.filter(s => s.statut === "clôturé").length;

    const skip = filters?.skip || 0;
    const limit = filters?.limit || 10;
    const pagedItems = items.slice(skip, skip + limit);

    return {
      items: pagedItems,
      total,
      total_ramassages,
      total_colis,
      en_attente,
      livres
    };
  },

  getPickupSlipById: (id: number) => {
    return globalSlips.find(s => s.id === id) || null;
  },

  createPickupSlip: (payload: any) => {
    const newId = globalSlips.length ? Math.max(...globalSlips.map(s => s.id)) + 1 : 1;
    const driver = globalDrivers.find(d => d.id === payload.driver_id) || { id: payload.driver_id, nom: "Chauffeur" };
    const agency = globalAgencies.find(a => a.id === payload.agency_id) || { id: payload.agency_id, nom: "Agence" };

    const pickups: MockPickup[] = (payload.pickups || []).map((p: any, idx: number) => ({
      id: Date.now() + idx,
      pickup_slip_id: newId,
      numero_declaration: p.numero_declaration || `BL-${Date.now()}`,
      client_nom: p.client_nom,
      client_telephone: p.client_telephone || null,
      adresse: p.adresse,
      ville: p.ville || agency.nom,
      nombre_colis: p.nombre_colis || 1,
      date: payload.date_tournee,
      heure: p.heure || payload.heure_debut || "08:00:00",
      observations: p.observations || null,
    }));

    const totalColis = pickups.reduce((acc, p) => acc + p.nombre_colis, 0);

    const newSlip: MockPickupSlip = {
      id: newId,
      numero_bordereau: `BS-${payload.date_tournee.replace(/-/g, "")}-${newId.toString().padStart(3, "0")}`,
      driver_id: payload.driver_id,
      agency_id: payload.agency_id,
      date_tournee: payload.date_tournee,
      heure_debut: payload.heure_debut || "08:00:00",
      heure_fin: null,
      statut: "en_cours",
      created_at: new Date().toISOString(),
      driver: { id: driver.id, nom: driver.nom },
      agency: { id: agency.id, nom: agency.nom },
      colis_count: totalColis,
      pickups_count: pickups.length,
      client_name: pickups[0]?.client_nom || "-",
      numero_declaration: pickups[0]?.numero_declaration || "-",
      pickups
    };

    globalSlips.unshift(newSlip);
    return newSlip;
  },

  updatePickupSlip: (id: number, payload: any) => {
    const idx = globalSlips.findIndex(s => s.id === id);
    if (idx >= 0) {
      const driver = payload.driver_id ? globalDrivers.find(d => d.id === payload.driver_id) : globalSlips[idx].driver;
      const agency = payload.agency_id ? globalAgencies.find(a => a.id === payload.agency_id) : globalSlips[idx].agency;
      globalSlips[idx] = {
        ...globalSlips[idx],
        ...payload,
        driver: driver ? { id: driver.id, nom: driver.nom } : globalSlips[idx].driver,
        agency: agency ? { id: agency.id, nom: agency.nom } : globalSlips[idx].agency,
      };
      return globalSlips[idx];
    }
    return null;
  },

  deletePickupSlip: (id: number) => {
    globalSlips = globalSlips.filter(s => s.id !== id);
    return true;
  },

  addPickupToSlip: (slipId: number, data: any) => {
    const slip = globalSlips.find(s => s.id === slipId);
    if (slip) {
      const newP: MockPickup = {
        id: Date.now(),
        pickup_slip_id: slipId,
        numero_declaration: data.numero_declaration,
        client_nom: data.client_nom,
        client_telephone: data.client_telephone || null,
        adresse: data.adresse,
        ville: data.ville,
        nombre_colis: data.nombre_colis || 1,
        date: data.date,
        heure: data.heure,
        observations: data.observations || null,
      };
      slip.pickups.push(newP);
      slip.pickups_count = slip.pickups.length;
      slip.colis_count = slip.pickups.reduce((acc, p) => acc + p.nombre_colis, 0);
      return newP;
    }
    return null;
  },

  closePickupSlip: (slipId: number) => {
    const slip = globalSlips.find(s => s.id === slipId);
    if (slip) {
      slip.statut = "clôturé";
      slip.heure_fin = new Date().toTimeString().slice(0, 8);
      return slip;
    }
    return null;
  },

  searchPickups: (params: { skip?: number; limit?: number; numero_declaration?: string; client?: string; ville?: string; driver_id?: string; agency_id?: string; date_pick?: string }) => {
    let allPickups: any[] = [];
    globalSlips.forEach(s => {
      s.pickups.forEach(p => {
        allPickups.push({
          ...p,
          driver_nom: s.driver.nom,
          agency_nom: s.agency.nom,
          driver_id: s.driver_id,
          agency_id: s.agency_id
        });
      });
    });

    if (params.numero_declaration) {
      allPickups = allPickups.filter(p => p.numero_declaration.includes(params.numero_declaration!));
    }
    if (params.client) {
      allPickups = allPickups.filter(p => p.client_nom.toLowerCase().includes(params.client!.toLowerCase()));
    }
    if (params.ville) {
      allPickups = allPickups.filter(p => p.ville.toLowerCase().includes(params.ville!.toLowerCase()));
    }
    if (params.driver_id) {
      allPickups = allPickups.filter(p => p.driver_id?.toString() === params.driver_id);
    }
    if (params.agency_id) {
      allPickups = allPickups.filter(p => p.agency_id?.toString() === params.agency_id);
    }
    if (params.date_pick) {
      allPickups = allPickups.filter(p => p.date === params.date_pick);
    }

    const total = allPickups.length;
    const skip = params.skip || 0;
    const limit = params.limit || 10;
    const items = allPickups.slice(skip, skip + limit);

    return { items, total };
  },

  getDashboardStats: () => {
    const totalPickups = globalSlips.reduce((acc, s) => acc + s.colis_count, 0);
    const driverMap: Record<string, { colis: number; ramassages: number }> = {};
    const agencyMap: Record<string, number> = {};

    globalSlips.forEach(s => {
      const dName = s.driver.nom;
      const aName = s.agency.nom;

      if (!driverMap[dName]) driverMap[dName] = { colis: 0, ramassages: 0 };
      driverMap[dName].colis += s.colis_count;
      driverMap[dName].ramassages += s.pickups_count;

      if (!agencyMap[aName]) agencyMap[aName] = 0;
      agencyMap[aName] += s.colis_count;
    });

    const colis_par_chauffeur = Object.entries(driverMap).map(([driver_name, val]) => ({
      driver_name,
      colis: val.colis,
      ramassages: val.ramassages
    }));

    const colis_par_agence = Object.entries(agencyMap).map(([agency_name, colis]) => ({
      agency_name,
      colis
    }));

    const top_chauffeurs = [...colis_par_chauffeur].sort((a, b) => b.colis - a.colis).slice(0, 5);

    return {
      colis_par_chauffeur,
      colis_par_agence,
      ramassages_jour: globalSlips.filter(s => s.date_tournee === new Date().toISOString().split("T")[0]).reduce((acc, s) => acc + s.colis_count, 0) || 20,
      ramassages_mois: totalPickups,
      top_chauffeurs
    };
  }
};
