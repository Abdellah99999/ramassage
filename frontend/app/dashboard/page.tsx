'use client';

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { 
  TrendingUp, 
  MapPin, 
  Truck, 
  AlertTriangle 
} from "lucide-react";

interface DriverColis {
  driver_name: string;
  colis: number;
  ramassages?: number;
}

interface AgencyColis {
  agency_name: string;
  colis: number;
}

interface DashboardStats {
  colis_par_chauffeur: DriverColis[];
  colis_par_agence: AgencyColis[];
  ramassages_jour: number;
  ramassages_mois: number;
  top_chauffeurs: DriverColis[];
}

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiFetch("/api/v1/dashboard/stats"),
  });

    if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[80vh] bg-background">
        <div className="w-10 h-10 rounded-none border border-border border-t-hes-red animate-spin mb-4" />
        <p className="text-hes-textMuted text-xs font-mono tracking-widest uppercase">Chargement du manifeste...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 max-w-4xl mx-auto bg-background">
        <div className="bg-white border border-border p-8 text-center rounded-none">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-hes-red" />
          <h3 className="font-title font-bold text-lg text-foreground uppercase tracking-wide">Erreur d'acquisition de données</h3>
          <p className="text-hes-textMuted font-mono text-xs mt-1">{(error as any)?.message || "Impossible de joindre l'API des statistiques."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-background text-foreground">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-title font-bold tracking-tight text-foreground">
          Tableau de bord
        </h1>
        <p className="text-hes-textMuted text-sm mt-1.5">
          Horizon Express Services — Console logistique en temps réel.
        </p>
        <div className="hes-ribbon mt-4" />
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Colis du Jour */}
        <div className="stat-card">
          <span className="text-[11px] font-mono font-semibold text-hes-textMuted uppercase">Colis collectés / aujourd'hui</span>
          <p className="text-4xl font-title font-bold text-foreground mt-3">{stats.ramassages_jour}</p>
        </div>

        {/* Card 2: Colis du Mois */}
        <div className="stat-card">
          <span className="text-[11px] font-mono font-semibold text-hes-textMuted uppercase">Colis collectés / mois</span>
          <p className="text-4xl font-title font-bold text-foreground mt-3">{stats.ramassages_mois}</p>
        </div>

        {/* Card 3: Chauffeurs actifs */}
        <div className="stat-card">
          <span className="text-[11px] font-mono font-semibold text-hes-textMuted uppercase">Chauffeurs actifs</span>
          <p className="text-4xl font-title font-bold text-foreground mt-3">{stats.top_chauffeurs.length}</p>
        </div>
      </div>

      {/* Manifests & Tables section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Card: Chauffeurs manifest */}
        <div className="card">
          <h3 className="font-title font-semibold text-sm text-foreground mb-5 border-b border-border pb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-hes-red" /> Manifeste — colis par chauffeur
          </h3>
          
          {stats.colis_par_chauffeur.length === 0 ? (
            <p className="text-xs font-mono text-hes-textMuted text-center py-10">AUCUNE DONNÉE DE TOURNÉE DISPONIBLE</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="table-header bg-slate-50">
                    <th className="table-header">Chauffeur</th>
                    <th className="table-header text-right">Ramassages</th>
                    <th className="table-header text-right">Volume colis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {stats.colis_par_chauffeur.map((item, idx) => (
                    <tr key={idx} className="hover:bg-background/20">
                      <td className="py-2.5 text-sm font-semibold text-foreground">{item.driver_name}</td>
                      <td className="py-2.5 text-right font-mono text-sm text-slate-500">{item.ramassages}</td>
                      <td className="py-2.5 text-right font-mono text-sm font-bold text-foreground">{item.colis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Stack Cards */}
        <div className="space-y-8">
          {/* Card: Agencies manifest */}
          <div className="bg-white p-6 border border-border rounded-none">
            <h3 className="font-title font-bold text-sm tracking-wider text-foreground mb-5 border-b border-border pb-3 uppercase flex items-center gap-2">
              <MapPin className="w-4 h-4 text-hes-blue" /> RÉPARTITION / COLIS PAR AGENCE
            </h3>
            
            {stats.colis_par_agence.length === 0 ? (
              <p className="text-xs font-mono text-hes-textMuted text-center py-10">AUCUNE DONNÉE D'AGENCE DISPONIBLE</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-hes-textMuted">Agence</th>
                      <th className="pb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-hes-textMuted text-right">Volume Colis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {stats.colis_par_agence.map((item, idx) => (
                      <tr key={idx} className="hover:bg-background/20">
                        <td className="py-2.5 text-sm font-semibold text-foreground">{item.agency_name}</td>
                        <td className="py-2.5 text-right font-mono text-sm font-bold text-foreground">{item.colis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card: Top Chauffeurs performance */}
          <div className="bg-white p-6 border border-border rounded-none">
            <h3 className="font-title font-bold text-sm tracking-wider text-foreground mb-5 border-b border-border pb-3 uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-hes-red" /> CLASSEMENT / TOP 5 CHAUFFEURS (MOIS)
            </h3>
            
            {stats.top_chauffeurs.length === 0 ? (
              <p className="text-xs font-mono text-hes-textMuted text-center py-10">AUCUNE DONNÉE DE CLASSEMENT</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-hes-textMuted">Rang &amp; Chauffeur</th>
                      <th className="pb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-hes-textMuted text-right">Ramassages</th>
                      <th className="pb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-hes-textMuted text-right">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {stats.top_chauffeurs.map((item, idx) => (
                      <tr key={idx} className="hover:bg-background/20">
                        <td className="py-2.5 text-sm font-semibold text-foreground">
                          <span className="font-mono text-hes-red font-bold mr-2">0{idx + 1}.</span>
                          {item.driver_name}
                        </td>
                        <td className="py-2.5 text-right font-mono text-sm text-slate-500">{item.ramassages}</td>
                        <td className="py-2.5 text-right font-mono text-sm font-bold text-hes-red">{item.colis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
