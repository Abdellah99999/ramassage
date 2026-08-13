'use client';

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useUser } from "../../context/UserContext";
import { useDebounce } from "../../hooks/useDebounce";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  MapPin, 
  AlertTriangle,
  User
} from "lucide-react";

interface PickupSearchItem {
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
  driver_nom: string;
  agency_nom: string;
}

interface SearchResponse {
  items: PickupSearchItem[];
  total: number;
}

export default function HistoriquePage() {
  const { user } = useUser();
  const [page, setPage] = useState(1);
  const limit = 10;

  // Search Fields
  const [numDeclaration, setNumDeclaration] = useState("");
  const [client, setClient] = useState("");
  const [ville, setVille] = useState("");
  const [driverId, setDriverId] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [datePick, setDatePick] = useState("");

  // Debounced Values (300ms)
  const debouncedNumDecl = useDebounce(numDeclaration, 300);
  const debouncedClient = useDebounce(client, 300);
  const debouncedVille = useDebounce(ville, 300);

  // Queries for select dropdowns
  const { data: drivers = [] } = useQuery<any[]>({
    queryKey: ["drivers"],
    queryFn: () => apiFetch("/api/v1/pickup-slips/drivers"),
  });

  const { data: agencies = [] } = useQuery<any[]>({
    queryKey: ["agencies"],
    queryFn: () => apiFetch("/api/v1/pickup-slips/agences"),
  });

  // Main search query
  const skip = (page - 1) * limit;
  const queryParams = new URLSearchParams();
  queryParams.append("skip", skip.toString());
  queryParams.append("limit", limit.toString());
  if (debouncedNumDecl) queryParams.append("numero_declaration", debouncedNumDecl);
  if (debouncedClient) queryParams.append("client", debouncedClient);
  if (debouncedVille) queryParams.append("ville", debouncedVille);
  if (driverId) queryParams.append("driver_id", driverId);
  if (agencyId) queryParams.append("agency_id", agencyId);
  if (datePick) queryParams.append("date_pick", datePick);

  const { data, isLoading, error, refetch } = useQuery<SearchResponse>({
    queryKey: ["search-pickups", page, debouncedNumDecl, debouncedClient, debouncedVille, driverId, agencyId, datePick],
    queryFn: () => apiFetch(`/api/v1/pickup-slips/pickups/search?${queryParams.toString()}`),
  });

  const pickups = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset page to 1 on new search
    refetch();
  };

  const handleReset = () => {
    setNumDeclaration("");
    setClient("");
    setVille("");
    setDriverId("");
    setAgencyId("");
    setDatePick("");
    setPage(1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-background text-foreground font-sans">
      <div className="pb-6">
        <h1 className="text-3xl font-title font-bold text-foreground">Historique des ramassages</h1>
        <p className="text-hes-textMuted text-sm mt-1.5">Recherche multicritère et traçabilité sur les manifestes logistiques.</p>
      </div>

      <div className="hes-ribbon mt-2 mb-6" />

      <form onSubmit={handleSearchSubmit} className="card">
        <div className="flex items-center gap-2.5 mb-5 border-b border-border pb-3">
          <Search className="w-4 h-4 text-hes-textMuted" />
          <h3 className="font-title font-bold text-xs text-foreground tracking-wider uppercase">Paramètres de recherche</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4.5">
          {/* N° BL */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">N° BL</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={numDeclaration}
              onChange={(e) => setNumDeclaration(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-background/20 border border-border rounded-none px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition-all duration-150"
              placeholder="Ex: 445566"
            />
          </div>

          {/* Client */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Client</label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="w-full bg-background/20 border border-border rounded-none px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
              placeholder="Nom client"
            />
          </div>

          {/* Ville */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Ville</label>
            <input
              type="text"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full bg-background/20 border border-border rounded-none px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
              placeholder="Ville"
            />
          </div>

          {/* Chauffeur */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Chauffeur</label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full bg-background/20 border border-border rounded-none px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
            >
              <option value="">Tous</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.nom}</option>
              ))}
            </select>
          </div>

          {/* Agence */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Agence</label>
            <select
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
              className="w-full bg-background/20 border border-border rounded-none px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
              disabled={user?.role !== "super_admin"}
            >
              <option value="">Toutes</option>
              {agencies.map(a => (
                <option key={a.id} value={a.id}>{a.nom}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Date</label>
            <input
              type="date"
              value={datePick}
              onChange={(e) => setDatePick(e.target.value)}
              className="w-full bg-background/20 border border-border rounded-none px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition-all duration-150"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-hes-textMuted hover:text-foreground transition"
          >
            Réinitialiser
          </button>
          <button type="submit" className="primary-btn">
            <Search className="w-4 h-4" />
            <span>Rechercher</span>
          </button>
        </div>
      </form>

      {/* Results Section */}
      {isLoading ? (
        <div className="card flex flex-col items-center justify-center p-16">
          <div className="w-10 h-10 rounded-full border border-border border-t-foreground animate-spin mb-4" />
          <p className="text-hes-textMuted text-xs font-mono tracking-widest uppercase">Recherche en cours...</p>
        </div>
      ) : error ? (
        <div className="card text-center text-hes-red">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-hes-red" />
          <p className="font-title font-bold text-sm">Erreur lors de la recherche</p>
          <p className="text-xs mt-1 text-hes-red">{(error as any)?.message}</p>
        </div>
      ) : pickups.length === 0 ? (
        <div className="card text-center p-20">
          <Package className="w-12 h-12 text-border mx-auto mb-4" />
          <h3 className="text-md font-title font-bold text-foreground mb-1">Aucun résultat</h3>
          <p className="text-hes-textMuted text-xs font-mono max-w-sm mx-auto">Aucun ramassage de colis ne correspond à vos critères.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="table-header bg-slate-50">
                    <th className="table-header">N° BL</th>
                    <th className="table-header">Client</th>
                    <th className="table-header">Adresse</th>
                    <th className="table-header">Ville</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Heure</th>
                    <th className="table-header">Chauffeur</th>
                    <th className="table-header">Agence</th>
                    <th className="table-header text-right">Colis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {pickups.map((p) => (
                    <tr key={p.id} className="hover:bg-background/10 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{p.numero_declaration}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{p.client_nom}</td>
                      <td className="px-6 py-4 text-xs text-hes-textMuted max-w-[150px] truncate" title={p.adresse}>{p.adresse}</td>
                      <td className="px-6 py-4 font-medium">{p.ville}</td>
                      <td className="px-6 py-4 text-xs font-mono text-hes-textMuted">{new Date(p.date).toLocaleDateString("fr-FR")}</td>
                      <td className="px-6 py-4 text-xs font-mono text-hes-textMuted">{p.heure.slice(0, 5)}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600"><span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {p.driver_nom}</span></td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600"><span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {p.agency_nom}</span></td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{p.nombre_colis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white px-6 py-4.5 border border-border rounded-md">
              <p className="font-mono text-hes-textMuted">Affichage de {skip + 1} à {Math.min(skip + limit, total)} sur {total} ramassages</p>
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
        </div>
      )}
    </div>
  );
}
