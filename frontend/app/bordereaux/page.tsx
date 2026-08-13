'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useUser } from "../../context/UserContext";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper
} from "@tanstack/react-table";
import {
  Plus,
  Filter,
  RefreshCw,
  X,
  FileText,
  AlertTriangle,
  Eye,
  Edit3,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  Printer
} from "lucide-react";

interface PickupSlipItem {
  id: number;
  numero_bordereau: string;
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
}

const columnHelper = createColumnHelper<PickupSlipItem>();

export default function BordereauxPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Filters State
  const [driverId, setDriverId] = useState<string>("");
  const [agencyId, setAgencyId] = useState<string>("");
  const [statut, setStatut] = useState<string>("");
  const [dateTournee, setDateTournee] = useState<string>("");
  
  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 10;
  
  React.useEffect(() => {
    setPage(1);
  }, [driverId, agencyId, statut, dateTournee]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDriverId, setNewDriverId] = useState("");
  const [newAgencyId, setNewAgencyId] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);

  // Colis (parcels) local add list
  const [colisList, setColisList] = useState<any[]>([]);
  const [parcelNumDeclaration, setParcelNumDeclaration] = useState("");
  const [parcelClient, setParcelClient] = useState("");
  const [parcelAddress, setParcelAddress] = useState("");
  // Parcel date will inherit from main form `newDate`
  const [parcelCount, setParcelCount] = useState("1");
  const [parcelObs, setParcelObs] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // View Details Modal State
  const [viewSlipId, setViewSlipId] = useState<number | null>(null);

  // Edit Slip Modal State
  const [editingSlip, setEditingSlip] = useState<any | null>(null);
  const [editDriverId, setEditDriverId] = useState("");
  const [editAgencyId, setEditAgencyId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Query for slip details in modal
  const { data: viewSlip, isLoading: isViewLoading } = useQuery<any>({
    queryKey: ["pickup-slip-detail", viewSlipId],
    queryFn: () => apiFetch(`/api/v1/pickup-slips/${viewSlipId}`),
    enabled: !!viewSlipId,
  });

  // Edit Mutation
  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; body: any }) => {
      return apiFetch(`/api/v1/pickup-slips/${payload.id}`, {
        method: "PUT",
        body: JSON.stringify(payload.body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-slips"] });
      setEditingSlip(null);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err.message || "Erreur lors de la modification du bordereau.");
    }
  });

  // Delete Confirmation Modal State
  const [deletingSlip, setDeletingSlip] = useState<{ id: number; code: string } | null>(null);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (slipId: number) => {
      return apiFetch(`/api/v1/pickup-slips/${slipId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-slips"] });
      setDeletingSlip(null);
    },
    onError: (err: any) => {
      setDeletingSlip(null);
      if (err?.status === 404 || err?.message?.includes("non trouvé")) {
        queryClient.invalidateQueries({ queryKey: ["pickup-slips"] });
        return;
      }
      alert(err.message || "Impossible de supprimer ce bordereau.");
    }
  });
  // Prevent background scroll and ensure full-page blur when modal is open
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (isModalOpen) {
      document.documentElement.classList.add("modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Queries
  const { data: drivers = [] } = useQuery<any[]>({
    queryKey: ["drivers"],
    queryFn: () => apiFetch("/api/v1/pickup-slips/drivers"),
    staleTime: 300000,
  });

  const { data: agencies = [] } = useQuery<any[]>({
    queryKey: ["agencies"],
    queryFn: () => apiFetch("/api/v1/pickup-slips/agences"),
    staleTime: 300000,
  });

  const skip = (page - 1) * limit;
  const queryParams = new URLSearchParams();
  queryParams.append("skip", skip.toString());
  queryParams.append("limit", limit.toString());
  if (driverId) queryParams.append("driver_id", driverId);
  if (agencyId) queryParams.append("agency_id", agencyId);
  if (statut) queryParams.append("statut", statut);
  if (dateTournee) queryParams.append("date_tournee", dateTournee);

  const { data, isLoading, error, refetch } = useQuery<any>({
    queryKey: ["pickup-slips", page, driverId, agencyId, statut, dateTournee],
    queryFn: () => apiFetch(`/api/v1/pickup-slips?${queryParams.toString()}`),
  });

  const slips = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => {
      return apiFetch("/api/v1/pickup-slips", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-slips"] });
      setIsModalOpen(false);
      setNewDriverId("");
      setNewAgencyId("");
      setParcelNumDeclaration("");
      setParcelClient("");
      setParcelAddress("");
      setParcelCount("1");
      setParcelObs("");
      setCreateError(null);
      setColisList([]);
    },
    onError: (err: any) => {
      setCreateError(err.message || "Une erreur est survenue lors de la création.");
    }
  });

  // Table setup
  const columns = [
    columnHelper.accessor("numero_bordereau", {
      header: "N° Bordereau",
      cell: info => <span className="font-mono font-bold text-foreground">{info.getValue()}</span>
    }),
    columnHelper.accessor((row: any) => row.numero_declaration ?? "-", {
      id: "numero_declaration",
      header: "N° BL",
      cell: info => <span className="font-mono text-foreground font-semibold">{info.getValue()}</span>
    }),
    columnHelper.accessor((row: any) => row.client_name ?? "-", {
      id: "client_name",
      header: "Client",
      cell: info => <span className="font-semibold text-foreground">{info.getValue()}</span>
    }),
    columnHelper.accessor("date_tournee", {
      header: "Date Tournée",
      cell: info => <span className="font-mono">{new Date(info.getValue()).toLocaleDateString("fr-FR")}</span>
    }),
    columnHelper.accessor(row => row.driver?.nom ?? "", {
      id: 'driver_nom',
      header: "Chauffeur",
      cell: info => <span className="font-semibold text-foreground">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => row.agency?.nom ?? "", {
      id: 'agency_nom',
      header: "Agence",
      cell: info => <span className="text-hes-textMuted">{info.getValue()}</span>
    }),
    columnHelper.accessor("pickups_count", {
      header: "Ramassages",
      cell: info => <span className="font-mono text-hes-textMuted">{info.getValue()}</span>
    }),
    columnHelper.accessor("colis_count", {
      header: "Total Colis",
      cell: info => <span className="font-mono font-bold text-foreground">{info.getValue()}</span>
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: info => {
        const slip = info.row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewSlipId(slip.id)}
              className="p-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition flex items-center justify-center cursor-pointer"
              title="Voir les détails en pop-up"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingSlip(slip);
                setEditDriverId(slip.driver?.id ? slip.driver.id.toString() : "");
                setEditAgencyId(slip.agency?.id ? slip.agency.id.toString() : "");
                setEditDate(slip.date_tournee ? slip.date_tournee.split("T")[0] : "");
                setEditError(null);
              }}
              className="p-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-md hover:bg-amber-100 transition flex items-center justify-center cursor-pointer"
              title="Modifier le bordereau"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeletingSlip({ id: slip.id, code: slip.numero_bordereau })}
              className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition flex items-center justify-center cursor-pointer"
              title="Supprimer le bordereau"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      }
    })
  ];

  const table = useReactTable({
    data: slips,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Summary stats for the top cards
  const totalBordereaux = data?.total || 0;
  const totalRamassages = data?.total_ramassages || 0;
  const totalColis = data?.total_colis || 0;
  const enAttente = data?.en_attente || 0;
  const livres = data?.livres || 0;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newDriverId ||
      !newAgencyId ||
      !newDate ||
      !parcelNumDeclaration.trim() ||
      !parcelClient.trim() ||
      !parcelAddress.trim() ||
      !parcelCount ||
      parseInt(parcelCount as any) <= 0
    ) {
      setCreateError("Veuillez saisir TOUS les champs obligatoires du bordereau (Chauffeur, Agence, Date, N° BL, Nom Client, Adresse et Nombre de colis).");
      return;
    }

    const selectedAgency = agencies.find(a => a.id.toString() === newAgencyId);
    const agencyVille = selectedAgency?.ville || selectedAgency?.nom || "";

    const formattedPickups = [{
      numero_declaration: parcelNumDeclaration.trim(),
      client_nom: parcelClient.trim(),
      client_telephone: null,
      adresse: parcelAddress.trim(),
      ville: agencyVille,
      nombre_colis: parseInt(parcelCount as any) || 1,
      date: newDate,
      heure: new Date().toTimeString().slice(0, 5),
      observations: parcelObs.trim() || null
    }];

    createMutation.mutate({
      driver_id: parseInt(newDriverId),
      agency_id: parseInt(newAgencyId),
      date_tournee: newDate,
      heure_debut: new Date().toTimeString().slice(0, 5),
      pickups: formattedPickups
    });
  };

  const handleAddParcel = () => {
    if (!parcelClient || !parcelCount || parseInt(parcelCount as any) <= 0) {
      setCreateError("Remplissez les champs obligatoires du colis (client et nombre de colis > 0).");
      return;
    }
    const selectedAgency = agencies.find(a => a.id.toString() === newAgencyId);
    const p = {
      id: Date.now(),
      numero_bon_livraison: parcelNumDeclaration || `BL-${Date.now()}`,
      client_nom: parcelClient,
      adresse: parcelAddress || "N/A",
      ville: selectedAgency?.ville || selectedAgency?.nom || "",
      date: newDate,
      heure: null,
      colis: parseInt(parcelCount as any) || 1,
      observations: parcelObs,
    };
    setColisList(prev => [...prev, p]);
    setParcelNumDeclaration("");
    setParcelClient("");
    setParcelAddress("");
    setParcelCount("1");
    setParcelObs("");
    setCreateError(null);
  };

  const handleRemoveParcel = (id: number) => {
    setColisList(prev => prev.filter(p => p.id !== id));
  };

  const clearFilters = () => {
    setDriverId("");
    setAgencyId("");
    setStatut("");
    setDateTournee("");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-background text-foreground font-sans">
      {/* Top Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6">
        <div>
          <h1 className="text-[30px] font-title font-bold tracking-tight text-foreground">Bordereaux de ramassage</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Gérez et suivez tous vos bordereaux de ramassage</p>
        </div>

        <button
          onClick={() => {
            setCreateError(null);
            setIsModalOpen(true);
          }}
          className="primary-btn rounded-md shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nouveau bordereau</span>
        </button>
      </div>

      {/* Ribbon element */}
      <div className="hes-ribbon !mt-0 !mb-8" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <div className="stat-card">
          <div className="text-sm text-hes-textMuted">Total Bordereaux</div>
          <div className="text-2xl font-title font-bold text-foreground">{totalBordereaux}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-hes-textMuted">Total Ramassages</div>
          <div className="text-2xl font-title font-bold text-foreground">{totalRamassages}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-hes-textMuted">Total Colis</div>
          <div className="text-2xl font-title font-bold text-foreground">{totalColis}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-hes-textMuted">En attente</div>
          <div className="text-2xl font-title font-bold text-hes-red">{enAttente}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-hes-textMuted">Livrés</div>
          <div className="text-2xl font-title font-bold text-hes-green">{livres}</div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5 border-b border-border pb-3">
          <Filter className="w-4 h-4 text-hes-textMuted" />
          <h3 className="font-title font-bold text-xs text-foreground tracking-wider uppercase">Filtres de recherche</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {/* Driver Filter */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Chauffeur</label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full bg-background/20 border border-border rounded-none px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
            >
              <option value="">Tous les chauffeurs</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.nom}</option>
              ))}
            </select>
          </div>

          {/* Agency Filter */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Agence</label>
            <select
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
              className="w-full bg-background/20 border border-border rounded-none px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
              disabled={user?.role !== "super_admin"}
            >
              <option value="">Toutes les agences</option>
              {agencies.map(a => (
                <option key={a.id} value={a.id}>{a.nom}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Date Tournée</label>
            <input
              type="date"
              value={dateTournee}
              onChange={(e) => setDateTournee(e.target.value)}
              className="w-full bg-background/20 border border-border rounded-none px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition-all duration-150"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-hes-textMuted hover:text-foreground transition"
          >
            Réinitialiser
          </button>
          <button onClick={() => refetch()} className="primary-btn">
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Main List Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-border p-16 flex flex-col items-center justify-center shadow-sm">
          <div className="w-10 h-10 rounded-none border border-slate-200 border-t-slate-800 animate-spin mb-4" />
          <p className="text-hes-textMuted text-xs font-mono tracking-widest uppercase">Chargement du manifeste...</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-hes-red rounded-lg p-8 text-center text-hes-red shadow-sm">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-hes-red" />
          <p className="font-title font-bold text-sm uppercase">Erreur de chargement</p>
          <p className="text-xs font-mono mt-1 text-hes-red">{(error as any)?.message}</p>
        </div>
      ) : slips.length === 0 ? (
        <div className="bg-white p-20 border border-border text-center rounded-lg shadow-sm">
          <FileText className="w-12 h-12 text-border mx-auto mb-4" />
          <h3 className="text-md font-title font-bold text-foreground mb-1 uppercase tracking-wider">AUCUN BORDEREAU</h3>
          <p className="text-hes-textMuted text-xs font-mono max-w-sm mx-auto">Aucun manifeste de transport ne correspond à vos critères de recherche.</p>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id} className="bg-slate-50 border-b border-border table-header">
                      {hg.headers.map(h => (
                        <th key={h.id} className="table-header">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-background/10 transition">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 text-slate-800 align-middle border-r border-border/45 last:border-r-0">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white px-6 py-4.5 border border-border rounded-md mt-6">
              <p className="font-mono text-hes-textMuted">Affichage de {skip + 1} à {Math.min(skip + limit, total)} sur {total} bordereaux</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-border rounded-md hover:bg-slate-50 disabled:opacity-40 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 border border-border rounded-md bg-slate-50 text-slate-900 font-mono font-bold">Page {page} sur {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-border rounded-md hover:bg-slate-50 disabled:opacity-40 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Brief list of parcels added (display under the table) */}
      {colisList.length > 0 && (
        <div className="card mt-6">
          <h4 className="text-sm font-title font-semibold mb-3">Colis ajoutés</h4>
          <ul className="divide-y divide-border">
            {colisList.map(p => (
              <li key={p.id} className="flex justify-between items-center px-4 py-3">
                <div>
                  <div className="font-mono font-bold">{p.numero_bon_livraison}</div>
                  <div className="text-hes-textMuted text-sm">{p.client_nom} • {p.ville} • {p.colis} colis • {p.date} {p.heure}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleRemoveParcel(p.id)} className="px-2 py-1 text-sm text-hes-red">Supprimer</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- CREATE NEW SLIP MODAL DIALOG --- */}
      {isModalOpen && (
        <div className="modal-root fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-border max-w-md w-full overflow-hidden shadow-md relative z-50">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-title font-semibold text-sm tracking-tight">Nouveau bordereau</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition cursor-pointer p-2 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              {createError && (
                <div className="bg-hes-red/10 border border-hes-red text-hes-red p-3 rounded-none text-xs font-mono uppercase tracking-wider">
                  {createError}
                </div>
              )}



              {/* Chauffeur selection */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">
                  Chauffeur *
                </label>
                <select
                  value={newDriverId}
                  onChange={(e) => setNewDriverId(e.target.value)}
                  className="w-full bg-background/20 border border-border rounded-none px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
                  required
                >
                  <option value="">Sélectionnez un chauffeur</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </select>
              </div>

              {/* Agence selection */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">
                  Agence *
                </label>
                <select
                  value={newAgencyId}
                  onChange={(e) => setNewAgencyId(e.target.value)}
                  className="w-full bg-background/20 border border-border rounded-none px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
                  required
                >
                  <option value="">Sélectionnez une agence</option>
                  {agencies.map(a => (
                    <option key={a.id} value={a.id}>{a.nom}</option>
                  ))}
                </select>
              </div>

              {/* Date Grid */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">
                    Date Tournée *
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-background/20 border border-border rounded-none px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition-all duration-150"
                    required
                  />
                </div>
              </div>

              {/* --- Parcel (colis) form details --- */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">N° Déclaration (BL) *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={parcelNumDeclaration}
                      onChange={(e) => setParcelNumDeclaration(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-background/20 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono"
                      placeholder="Ex: 445566"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Nom du client *</label>
                    <input
                      value={parcelClient}
                      onChange={(e) => setParcelClient(e.target.value)}
                      className="w-full bg-background/20 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white"
                      placeholder="Ex: Société ABC"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Adresse *</label>
                    <input
                      value={parcelAddress}
                      onChange={(e) => setParcelAddress(e.target.value)}
                      className="w-full bg-background/20 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white"
                      placeholder="Ex: 15 Bd Anfa"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Nombre de colis *</label>
                    <input
                      type="number"
                      min={1}
                      value={parcelCount}
                      onChange={(e) => setParcelCount(e.target.value)}
                      className="w-full bg-background/20 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Observations (Optionnel)</label>
                    <input
                      value={parcelObs}
                      onChange={(e) => setParcelObs(e.target.value)}
                      className="w-full bg-background/20 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white"
                      placeholder="Ex: Colis fragiles"
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-5 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition rounded-md"
                  disabled={createMutation.isPending}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="primary-btn flex items-center gap-2"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20 border-t-white animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Créer bordereau</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Details Pop-up Modal */}
      {viewSlipId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="p-5 border-b border-border flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-title font-bold text-lg text-foreground">
                  Détails du Bordereau : <span className="font-mono text-hes-blue">{viewSlip?.numero_bordereau || `BS-#${viewSlipId}`}</span>
                </h3>
                <p className="text-xs text-hes-textMuted font-mono">
                  {viewSlip?.date_tournee && `Tournée du ${new Date(viewSlip.date_tournee).toLocaleDateString("fr-FR")}`}
                </p>
              </div>
              <button
                onClick={() => setViewSlipId(null)}
                className="p-2 text-hes-textMuted hover:text-foreground rounded-md hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {isViewLoading ? (
                <div className="py-10 text-center text-hes-textMuted animate-pulse font-mono text-xs uppercase">Chargement des détails...</div>
              ) : viewSlip ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-md border border-border text-sm">
                    <div>
                      <span className="block text-[10px] font-mono uppercase text-hes-textMuted">Chauffeur</span>
                      <span className="font-semibold text-foreground">{viewSlip.driver?.nom || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono uppercase text-hes-textMuted">Agence</span>
                      <span className="font-semibold text-foreground">{viewSlip.agency?.nom || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono uppercase text-hes-textMuted">Total Colis</span>
                      <span className="font-mono uppercase font-bold text-foreground">
                        {viewSlip.pickups?.reduce((acc: number, curr: any) => acc + (curr.nombre_colis || 0), 0) || 0}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-title font-bold text-xs uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-hes-blue" />
                      Liste des Colis / Ramassages ({viewSlip.pickups?.length || 0})
                    </h4>
                    {viewSlip.pickups && viewSlip.pickups.length > 0 ? (
                      <div className="border border-border rounded-md overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 border-b border-border font-mono font-bold uppercase text-hes-textMuted">
                            <tr>
                              <th className="p-2.5">N° BL</th>
                              <th className="p-2.5">Client</th>
                              <th className="p-2.5">Téléphone</th>
                              <th className="p-2.5">Adresse</th>
                              <th className="p-2.5">Ville</th>
                              <th className="p-2.5 text-right">Colis</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {viewSlip.pickups.map((p: any) => (
                              <tr key={p.id} className="hover:bg-slate-50">
                                <td className="p-2.5 font-mono font-bold text-foreground">{p.numero_declaration || "N/A"}</td>
                                <td className="p-2.5 font-semibold text-foreground">{p.client_nom}</td>
                                <td className="p-2.5 text-hes-textMuted">{p.client_telephone || "-"}</td>
                                <td className="p-2.5 text-hes-textMuted">{p.adresse || "N/A"}</td>
                                <td className="p-2.5 font-semibold text-slate-700">{p.ville || "-"}</td>
                                <td className="p-2.5 text-right font-mono font-bold text-foreground">{p.nombre_colis}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-hes-textMuted bg-slate-50 border border-border rounded-md">
                        Aucun colis enregistré dans ce bordereau.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-hes-red text-xs font-mono">Impossible de charger les détails.</div>
              )}
            </div>

            <div className="p-4 border-t border-border flex justify-between items-center bg-slate-50">
              {viewSlip && (
                <a
                  href={`/api/v1/pickup-slips/${viewSlip.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="primary-btn text-xs font-semibold py-2 px-3 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer PDF
                </a>
              )}
              <button
                onClick={() => setViewSlipId(null)}
                className="px-4 py-2 bg-slate-200 text-foreground hover:bg-slate-300 rounded-md text-sm font-semibold ml-auto"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSlip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-border">
            <div className="p-5 border-b border-border flex justify-between items-center bg-slate-50">
              <h3 className="font-title font-bold text-base text-foreground">
                Modifier le Bordereau : <span className="font-mono text-hes-blue">{editingSlip.numero_bordereau}</span>
              </h3>
              <button
                onClick={() => setEditingSlip(null)}
                className="p-1.5 text-hes-textMuted hover:text-foreground rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  id: editingSlip.id,
                  body: {
                    driver_id: parseInt(editDriverId),
                    agency_id: parseInt(editAgencyId),
                    date_tournee: editDate
                  }
                });
              }}
              className="p-6 space-y-4"
            >
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-xs font-mono">
                  {editError}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted mb-1">Chauffeur *</label>
                <select
                  value={editDriverId}
                  onChange={(e) => setEditDriverId(e.target.value)}
                  className="w-full bg-background/20 border border-border px-3 py-2 text-sm rounded-none"
                  required
                >
                  <option value="">Sélectionnez un chauffeur</option>
                  {drivers.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted mb-1">Agence *</label>
                <select
                  value={editAgencyId}
                  onChange={(e) => setEditAgencyId(e.target.value)}
                  className="w-full bg-background/20 border border-border px-3 py-2 text-sm rounded-none"
                  required
                >
                  <option value="">Sélectionnez une agence</option>
                  {agencies.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted mb-1">Date Tournée *</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-background/20 border border-border px-3 py-2 text-sm font-mono rounded-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingSlip(null)}
                  className="px-4 py-2 text-sm text-hes-textMuted hover:text-foreground"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-semibold shadow-sm"
                >
                  {updateMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Delete Confirmation Modal */}
      {deletingSlip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-title font-bold text-base text-foreground mb-2">
                Confirmer la suppression
              </h3>
              <p className="text-xs text-hes-textMuted leading-relaxed">
                Voulez-vous vraiment supprimer le bordereau{" "}
                <span className="font-mono font-bold text-foreground">{deletingSlip.code}</span> ?
                <br />
                Cette action est irréversible.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-border flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingSlip(null)}
                className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-hes-textMuted hover:text-foreground bg-white border border-border rounded-md transition cursor-pointer"
                disabled={deleteMutation.isPending}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingSlip.id)}
                className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-hes-red hover:bg-hes-red/90 text-white rounded-md shadow-sm transition flex items-center gap-2 cursor-pointer"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border border-white/20 border-t-white animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
