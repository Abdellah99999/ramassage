'use client';

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { 
  Printer, 
  User, 
  Calendar, 
  AlertTriangle,
  FileText,
  Building2,
  Package,
  CheckCircle2
} from "lucide-react";

export default function ImpressionPage() {
  const [driverId, setDriverId] = useState<string>("3"); // Default to Fares Ben Salah or first driver
  const [dateDebut, setDateDebut] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0] // First of current month
  );
  const [dateFin, setDateFin] = useState(
    new Date().toISOString().split("T")[0] // Today
  );

  // Query drivers
  const { data: drivers = [], isLoading: loadingDrivers } = useQuery<any[]>({
    queryKey: ["drivers"],
    queryFn: () => apiFetch("/api/v1/pickup-slips/drivers"),
  });

  // Query slips based on driver and dates
  const queryParams = new URLSearchParams();
  if (driverId) queryParams.append("driver_id", driverId);
  queryParams.append("limit", "50");

  const { data: slipsData, isLoading: loadingSlips } = useQuery<any>({
    queryKey: ["pickup-slips-print", driverId, dateDebut, dateFin],
    queryFn: () => apiFetch(`/api/v1/pickup-slips?${queryParams.toString()}`),
  });

  const slips = slipsData?.items || [];
  const selectedDriver = drivers.find(d => d.id.toString() === driverId) || drivers[0];

  // Collect all pickups from matching slips
  const allPickups: any[] = [];
  slips.forEach((s: any) => {
    if (s.pickups && s.pickups.length > 0) {
      s.pickups.forEach((p: any) => {
        allPickups.push({
          ...p,
          numero_bordereau: s.numero_bordereau,
          date_tournee: s.date_tournee,
          heure_debut: s.heure_debut,
          driver_nom: s.driver?.nom || selectedDriver?.nom || "Chauffeur",
          agency_nom: s.agency?.nom || "Agence Centrale"
        });
      });
    }
  });

  const totalColis = allPickups.reduce((acc, p) => acc + (p.nombre_colis || 1), 0);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-background text-foreground font-sans">
      {/* Page Header (Hidden on Print) */}
      <div className="no-print border-b border-border pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-title font-bold tracking-tight">Impression & Manifeste de Tournée</h1>
          <p className="text-hes-textMuted text-sm mt-1.5">Générez, prévisualisez et imprimez les feuilles d'émargement officielles.</p>
        </div>
        <button
          onClick={handlePrint}
          className="primary-btn px-5 py-2.5 rounded-md flex items-center gap-2 shadow-md cursor-pointer hover:opacity-95"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimer la fiche (A4 / PDF)</span>
        </button>
      </div>

      <div className="hes-ribbon no-print !mt-0 !mb-8" />

      {/* Filter Parameters Card (Hidden on Print) */}
      <div className="card no-print">
        <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
          <FileText className="w-5 h-5 text-hes-blue" />
          <h2 className="font-title font-bold text-sm text-foreground uppercase tracking-wider">Sélection de la tournée à imprimer</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Driver selection */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Chauffeur *
            </label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full bg-background/20 border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition"
              disabled={loadingDrivers}
            >
              <option value="">Tous les chauffeurs</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.nom} ({d.agency?.nom || "Agence"})</option>
              ))}
            </select>
          </div>

          {/* Date Debut */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date Début *
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full bg-background/20 border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition"
            />
          </div>

          {/* Date Fin */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date Fin *
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full bg-background/20 border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition"
            />
          </div>
        </div>
      </div>

      {/* --- LIVE PRINTABLE MANIFEST SHEET (Visible on screen and printed on A4) --- */}
      <div className="bg-white border border-border rounded-xl p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center rounded-lg font-title font-bold text-primary text-xl">
              HES
            </div>
            <div>
              <h2 className="font-title font-black text-xl tracking-tight uppercase text-foreground">
                Horizon Express Services
              </h2>
              <p className="text-xs text-muted-foreground font-mono">FEUILLE D'ÉMARGEMENT & MANIFESTE DE RAMASSAGE</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 font-mono text-xs font-bold uppercase rounded">
              DOCUMENT OFFICIEL
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Édité le : {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR").slice(0, 5)}
            </p>
          </div>
        </div>

        {/* Tour Information Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div>
            <span className="block text-[10px] font-mono uppercase text-muted-foreground">Chauffeur</span>
            <span className="font-bold text-sm text-foreground">{selectedDriver ? selectedDriver.nom : "Tous les chauffeurs"}</span>
          </div>
          <div>
            <span className="block text-[10px] font-mono uppercase text-muted-foreground">Agence</span>
            <span className="font-bold text-sm text-foreground">{selectedDriver?.agency?.nom || "Réseau National H.E.S."}</span>
          </div>
          <div>
            <span className="block text-[10px] font-mono uppercase text-muted-foreground">Période</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {new Date(dateDebut).toLocaleDateString("fr-FR")} au {new Date(dateFin).toLocaleDateString("fr-FR")}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-mono uppercase text-muted-foreground">Total Colis / Déclarations</span>
            <span className="font-mono text-sm font-bold text-primary">
              {totalColis} colis ({allPickups.length} ramassages)
            </span>
          </div>
        </div>

        {/* Manifest Table */}
        {loadingSlips ? (
          <div className="py-16 text-center text-muted-foreground font-mono text-xs uppercase animate-pulse">
            Chargement du manifeste de tournée...
          </div>
        ) : allPickups.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border rounded-lg">
            <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Aucun ramassage trouvé pour cette sélection</p>
            <p className="text-xs text-muted-foreground mt-1">Sélectionnez un autre chauffeur ou élargissez la période de dates.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-mono font-bold uppercase text-slate-700">
                  <th className="py-2.5 px-3 border-r border-slate-300">N° BL</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">N° Bordereau</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Client / Expéditeur</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Adresse & Ville</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center">Colis</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Date & Heure</th>
                  <th className="py-2.5 px-3 text-center min-w-[120px]">Émargement Client</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {allPickups.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 border-r border-slate-200">
                      {p.numero_declaration}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 border-r border-slate-200">
                      {p.numero_bordereau}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      {p.client_nom}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200">
                      {p.adresse}, <span className="font-medium">{p.ville}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-center text-slate-900 border-r border-slate-200">
                      {p.nombre_colis}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 border-r border-slate-200">
                      {new Date(p.date_tournee || p.date).toLocaleDateString("fr-FR")} {p.heure?.slice(0, 5)}
                    </td>
                    <td className="py-2.5 px-3 border-slate-200 text-center h-12 align-bottom">
                      <span className="text-[9px] text-slate-400 border-b border-dashed border-slate-300 pb-0.5 block w-full">
                        Signature / Tampon
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                  <td colSpan={4} className="py-3 px-3 text-right font-mono uppercase text-xs">
                    TOTAL GÉNÉRAL COLIS :
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-sm text-primary">
                    {totalColis}
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-right font-mono text-[11px] text-muted-foreground">
                    {allPickups.length} déclarations au total
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Signatures Footer for Print */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-xs">
          <div className="border border-slate-300 rounded p-4 h-28 flex flex-col justify-between">
            <span className="font-bold text-slate-700 uppercase tracking-wide">Signature du Chauffeur :</span>
            <span className="text-[10px] text-muted-foreground font-mono">Date & Heure : ______________________</span>
          </div>
          <div className="border border-slate-300 rounded p-4 h-28 flex flex-col justify-between">
            <span className="font-bold text-slate-700 uppercase tracking-wide">Cachet & Signature Agence H.E.S. :</span>
            <span className="text-[10px] text-muted-foreground font-mono">Visa du Responsable d'exploitation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
