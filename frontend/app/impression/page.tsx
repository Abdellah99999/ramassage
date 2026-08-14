'use client';

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { 
  Printer, 
  User, 
  Calendar, 
  AlertTriangle,
  FileDown,
  FileText
} from "lucide-react";

export default function ImpressionPage() {
  const [driverId, setDriverId] = useState("");
  const [dateDebut, setDateDebut] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0] // First of current month
  );
  const [dateFin, setDateFin] = useState(
    new Date().toISOString().split("T")[0] // Today
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  // Query to populate the drivers select list
  const { data: drivers = [], isLoading: loadingDrivers } = useQuery<any[]>({
    queryKey: ["drivers"],
    queryFn: () => apiFetch("/api/v1/pickup-slips/drivers"),
  });

  const fetchPdf = async (isPreview: boolean) => {
    if (!driverId || !dateDebut || !dateFin) {
      setPrintError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    
    setIsDownloading(true);
    setPrintError(null);
    try {
      const url = `/api/v1/pickup-slips/print?driver_id=${driverId}&date_debut=${dateDebut}&date_fin=${dateFin}&preview=${isPreview}`;
      
      if (isPreview) {
        window.open(url, "_blank");
        setIsDownloading(false);
        return;
      }
      
      const res = await fetch(url);
      if (!res.ok) {
        let errorMsg = "Impossible de générer le bordereau PDF.";
        try {
          const errData = await res.json();
          errorMsg = errData.detail || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }
      
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      
      const filename = `bordereau_${driverId}_${dateDebut}_${dateFin}.html`;
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setPrintError(err.message || "Erreur lors du traitement du PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-background text-foreground font-sans">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-title font-bold tracking-tight">Impression des bordereaux</h1>
        <p className="text-hes-textMuted text-sm mt-1.5">Générez et téléchargez le manifeste de tournée signé au format PDF.</p>
      </div>

      <div className="hes-ribbon mt-2 mb-6" />

      <div className="card">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <Printer className="w-4 h-4 text-slate-600" />
          <h2 className="font-title font-bold text-sm">Paramètres d'impression</h2>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-6">
          {printError && (
            <div className="bg-white border border-hes-red text-hes-red p-4 rounded-none text-xs font-mono uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{printError}</span>
            </div>
          )}

          {/* Chauffeur Field */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Chauffeur *
            </label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full bg-background/20 border border-border rounded-none px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
              disabled={loadingDrivers}
              required
            >
              <option value="">
                {loadingDrivers ? "Chargement des chauffeurs..." : "Sélectionnez un chauffeur"}
              </option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.nom}</option>
              ))}
            </select>
          </div>

          {/* Date range grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date Début *
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full bg-background/20 border border-border rounded-none px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition-all duration-150"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date Fin *
              </label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full bg-background/20 border border-border rounded-none px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition-all duration-150"
                required
              />
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button type="button" onClick={() => fetchPdf(true)} disabled={isDownloading || !driverId} className="px-4 py-3 border border-border rounded-md bg-white text-hes-blue flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-slate-50 transition cursor-pointer">
              <FileText className="w-4 h-4" />
              <span>Aperçu</span>
            </button>

            <button type="button" onClick={() => fetchPdf(false)} disabled={isDownloading || !driverId} className="primary-btn flex items-center justify-center gap-2">
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 rounded-full border border-white/20 border-t-white animate-spin" />
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Télécharger</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
