'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useUser } from "../../context/UserContext";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Building2, 
  AlertTriangle,
  ShieldAlert
} from "lucide-react";

interface AgencyItem {
  id: number;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  responsable: string | null;
  actif: boolean;
}

export default function AgencesPage() {
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<AgencyItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [responsable, setResponsable] = useState("");
  const [actif, setActif] = useState(true);

  // Queries
  const { data: agencies = [], isLoading, error } = useQuery<AgencyItem[]>({
    queryKey: ["agencies-crud"],
    queryFn: () => apiFetch("/api/v1/agences-crud"),
    enabled: currentUser?.role === "super_admin",
  });

  // Create/Update mutations
  const saveMutation = useMutation({
    mutationFn: (payload: { id?: number; body: any }) => {
      if (payload.id) {
        return apiFetch(`/api/v1/agences-crud/${payload.id}`, {
          method: "PUT",
          body: JSON.stringify(payload.body),
        });
      } else {
        return apiFetch("/api/v1/agences-crud", {
          method: "POST",
          body: JSON.stringify(payload.body),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies-crud"] });
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      closeModal();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Une erreur est survenue lors de l'enregistrement.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (agencyId: number) => {
      return apiFetch(`/api/v1/agences-crud/${agencyId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies-crud"] });
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
    },
    onError: (err: any) => {
      alert(err.message || "Impossible de supprimer cette agence.");
    }
  });

  const openCreateModal = () => {
    setEditingAgency(null);
    setNom("");
    setAdresse("");
    setTelephone("");
    setResponsable("");
    setActif(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (a: AgencyItem) => {
    setEditingAgency(a);
    setNom(a.nom);
    setAdresse(a.adresse || "");
    setTelephone(a.telephone || "");
    setResponsable(a.responsable || "");
    setActif(a.actif);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAgency(null);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!nom) {
      setErrorMsg("Le nom de l'agence est requis.");
      return;
    }

    const payloadBody = {
      nom,
      adresse: adresse || null,
      telephone: telephone || null,
      responsable: responsable || null,
      actif,
    };

    saveMutation.mutate({
      id: editingAgency?.id,
      body: payloadBody,
    });
  };

  const handleDelete = (agencyId: number, agencyNom: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'agence "${agencyNom}" ?`)) {
      deleteMutation.mutate(agencyId);
    }
  };

  if (currentUser?.role !== "super_admin") {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-background text-foreground font-sans">
        <div className="bg-white border border-hes-red p-8 text-center text-hes-red rounded-lg shadow-sm">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-hes-red" />
          <h2 className="font-title font-bold text-sm uppercase tracking-wider">ACCÈS ENRESTREINT</h2>
          <p className="text-xs font-mono mt-2 text-hes-red">Seuls les administrateurs généraux peuvent gérer les agences du réseau H.E.S.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-background text-foreground font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6">
        <div>
          <h1 className="text-3xl font-title font-bold text-foreground">Gestion des agences</h1>
          <p className="text-hes-textMuted text-sm mt-1.5">Création et paramétrage des agences régionales du réseau H.E.S.</p>
        </div>
        <button onClick={openCreateModal} className="primary-btn rounded-md">
          <Plus className="w-4 h-4" />
          <span>Créer une agence</span>
        </button>
      </div>

      <div className="hes-ribbon mt-2 mb-6" />

      {/* Main Content */}
      {isLoading ? (
        <div className="card flex flex-col items-center justify-center p-16">
          <div className="w-10 h-10 rounded-full border border-border border-t-foreground animate-spin mb-4" />
          <p className="text-hes-textMuted text-xs font-mono tracking-widest uppercase">Chargement du registre des agences...</p>
        </div>
      ) : error ? (
        <div className="card text-center text-hes-red">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-hes-red" />
          <p className="font-title font-bold text-sm">Erreur de chargement</p>
          <p className="text-xs mt-1 text-hes-red">{(error as any)?.message}</p>
        </div>
      ) : agencies.length === 0 ? (
        <div className="card text-center p-20">
          <Building2 className="w-12 h-12 text-border mx-auto mb-4" />
          <h3 className="text-md font-title font-bold text-foreground mb-1">Aucune agence</h3>
          <p className="text-hes-textMuted text-xs font-mono max-w-sm mx-auto">Aucune agence logistique n'est enregistrée dans le système.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header bg-slate-50">
                  <th className="table-header">Nom</th>
                  <th className="table-header">Responsable</th>
                  <th className="table-header">Téléphone</th>
                  <th className="table-header">Adresse</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-foreground">
                {agencies.map((a) => (
                  <tr key={a.id} className="hover:bg-background/10 transition">
                    <td className="px-6 py-4 font-semibold">{a.nom}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{a.responsable || <span className="text-slate-400 italic">Non spécifié</span>}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700">{a.telephone || <span className="text-slate-400 italic">Non renseigné</span>}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={a.adresse || ""}>{a.adresse || <span className="text-slate-400 italic">Non spécifiée</span>}</td>
                    <td className="px-6 py-4">
                      <span className={a.actif ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700" : "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700"}>
                        {a.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right align-middle">
                      <div className="flex justify-end gap-3.5">
                        <button onClick={() => openEditModal(a)} className="p-2 border border-border bg-white hover:bg-slate-50 transition rounded-md text-slate-700" title="Modifier">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(a.id, a.nom)} className="p-2 border border-hes-red/30 bg-white hover:bg-hes-red/10 transition rounded-md text-hes-red" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT MODAL DIALOG --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-hes-blue/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-border max-w-md w-full overflow-hidden shadow-xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-hes-blue text-white px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white/80" />
                <h3 className="font-title font-bold text-xs tracking-wider uppercase">
                  {editingAgency ? "MODIFIER L'AGENCE" : "AJOUTER UNE AGENCE"}
                </h3>
              </div>
              <button 
                onClick={closeModal}
                className="text-white/60 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-hes-red/10 border border-hes-red text-hes-red p-3 rounded-none text-xs font-mono uppercase tracking-wider">
                  {errorMsg}
                </div>
              )}

              {/* Nom */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-1.5">
                  Nom de l'agence *
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full bg-background/20 border border-border rounded-none px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
                  required
                />
              </div>

              {/* Responsable */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-1.5">
                  Responsable / Directeur
                </label>
                <input
                  type="text"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="w-full bg-background/20 border border-border rounded-none px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
                  placeholder="Ex: Yassine Trabelsi"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-1.5">
                  Numéro de Téléphone
                </label>
                <input
                  type="text"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full bg-background/20 border border-border rounded-none px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition-all duration-150"
                  placeholder="Ex: 71 123 456"
                />
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-1.5">
                  Adresse
                </label>
                <input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  className="w-full bg-background/20 border border-border rounded-none px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg_white transition-all duration-150"
                  placeholder="Zone, Rue, Code postal"
                />
              </div>

              {/* Status checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="actif"
                  checked={actif}
                  onChange={(e) => setActif(e.target.checked)}
                  className="rounded-none border-border focus:ring-hes-blue text-hes-blue"
                />
                <label htmlFor="actif" className="text-xs font-mono font-bold uppercase text-hes-textMuted tracking-wider select-none cursor-pointer">
                  Agence active
                </label>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-5 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-hes-textMuted hover:text-foreground transition"
                  disabled={saveMutation.isPending}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-hes-red hover:bg-hes-red/90 text-white rounded-none text-xs font-title font-bold tracking-wider uppercase transition flex items-center gap-1.5 cursor-pointer"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-none border border-white/20 border-t-white animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>Enregistrer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
