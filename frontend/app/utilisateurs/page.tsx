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
  Users, 
  AlertTriangle,
  ShieldAlert
} from "lucide-react";

interface UserItem {
  id: number;
  nom: string;
  email: string;
  role: string;
  agence_id: number | null;
  actif: boolean;
  created_at: string;
  agency?: {
    id: number;
    nom: string;
  } | null;
}

export default function UtilisateursPage() {
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("agent");
  const [agenceId, setAgenceId] = useState("");
  const [actif, setActif] = useState(true);

  // Queries
  const { data: users = [], isLoading, error } = useQuery<UserItem[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch("/api/v1/users"),
  });

  const { data: agencies = [] } = useQuery<any[]>({
    queryKey: ["agencies"],
    queryFn: () => apiFetch("/api/v1/pickup-slips/agences"),
  });

  // Create/Update mutations
  const saveMutation = useMutation({
    mutationFn: (payload: { id?: number; body: any }) => {
      if (payload.id) {
        return apiFetch(`/api/v1/users/${payload.id}`, {
          method: "PUT",
          body: JSON.stringify(payload.body),
        });
      } else {
        return apiFetch("/api/v1/users", {
          method: "POST",
          body: JSON.stringify(payload.body),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeModal();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Une erreur est survenue lors de l'enregistrement.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => {
      return apiFetch(`/api/v1/users/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      alert(err.message || "Impossible de supprimer cet utilisateur.");
    }
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setNom("");
    setEmail("");
    setPassword("");
    setRole(currentUser?.role === "manager" ? "agent" : "agent");
    setAgenceId(currentUser?.role === "manager" && currentUser.agence_id ? currentUser.agence_id.toString() : "");
    setActif(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserItem) => {
    setEditingUser(u);
    setNom(u.nom);
    setEmail(u.email);
    setPassword("");
    setRole(u.role);
    setAgenceId(u.agence_id ? u.agence_id.toString() : "");
    setActif(u.actif);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!nom || !email || (!editingUser && !password)) {
      setErrorMsg("Veuillez renseigner tous les champs obligatoires.");
      return;
    }

    const payloadBody: any = {
      nom,
      email,
      role,
      agence_id: role === "super_admin" || !agenceId ? null : parseInt(agenceId),
      actif,
    };

    if (password) {
      payloadBody.password = password;
    }

    saveMutation.mutate({
      id: editingUser?.id,
      body: payloadBody,
    });
  };

  const handleDelete = (userId: number, userNom: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userNom}" ?`)) {
      deleteMutation.mutate(userId);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-background text-foreground font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6">
        <div>
          <h1 className="text-3xl font-title font-bold tracking-tight text-foreground">Gestion des utilisateurs</h1>
          <p className="text-hes-textMuted text-sm mt-1.5">Contrôle des comptes d'accès managers et agents du réseau H.E.S.</p>
        </div>

        {(currentUser?.role === "super_admin" || currentUser?.role === "manager") && (
          <button onClick={openCreateModal} className="primary-btn rounded-md">
            <Plus className="w-4 h-4" />
            <span>Créer un utilisateur</span>
          </button>
        )}
      </div>

      <div className="hes-ribbon mt-2 mb-6" />

      {/* Main Content */}
      {isLoading ? (
        <div className="card flex flex-col items-center justify-center p-16">
          <div className="w-10 h-10 rounded-full border border-border border-t-foreground animate-spin mb-4" />
          <p className="text-hes-textMuted text-xs font-mono tracking-widest uppercase">Chargement des utilisateurs...</p>
        </div>
      ) : error ? (
        <div className="card text-center text-hes-red">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-hes-red" />
          <p className="font-title font-bold text-sm">Erreur de chargement</p>
          <p className="text-xs mt-1 text-hes-red">{(error as any)?.message}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center p-20">
          <Users className="w-12 h-12 text-border mx-auto mb-4" />
          <h3 className="text-md font-title font-bold text-foreground mb-1">Aucun utilisateur</h3>
          <p className="text-hes-textMuted text-xs font-mono max-w-sm mx-auto">Aucun compte utilisateur configuré dans le périmètre actuel.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header bg-slate-50">
                  <th className="table-header">Nom</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Rôle</th>
                  <th className="table-header">Agence affectée</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-foreground">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-background/10 transition">
                    <td className="px-6 py-4 font-semibold">{u.nom}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4 font-mono text-xs uppercase tracking-wide">
                      {u.role === "super_admin" && "Super Admin"}
                      {u.role === "manager" && "Manager"}
                      {u.role === "agent" && "Agent"}
                    </td>
                    <td className="px-6 py-4">{u.agency ? <span className="font-semibold">{u.agency.nom}</span> : <span className="text-hes-textMuted font-mono text-xs">TOUS (HORS AGENCE)</span>}</td>
                    <td className="px-6 py-4">
                      <span className={u.actif ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700" : "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700"}>
                        {u.actif ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right align-middle">
                      <div className="flex justify-end gap-3.5">
                        <button onClick={() => openEditModal(u)} className="p-2 border border-border bg-white hover:bg-slate-50 transition rounded-md text-slate-700" title="Modifier">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button onClick={() => handleDelete(u.id, u.nom)} className="p-2 border border-hes-red/30 bg-white hover:bg-hes-red/10 transition rounded-md text-hes-red" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
                <Users className="w-4 h-4 text-white/80" />
                <h3 className="font-title font-bold text-xs tracking-wider uppercase">
                  {editingUser ? "MODIFIER L'UTILISATEUR" : "CRÉER UN UTILISATEUR"}
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
                  Nom Complet *
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full bg-background/20 border border-border rounded-none px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-1.5">
                  Adresse Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background/20 border border-border rounded-none px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-1.5">
                  {editingUser ? "Nouveau mot de passe (optionnel)" : "Mot de passe *"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background/20 border border-border rounded-none px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
                  required={!editingUser}
                  placeholder={editingUser ? "•••••••• (inchangé si vide)" : "Au moins 6 caractères"}
                />
              </div>

              {/* Role selection */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-1.5">
                  Rôle *
                </label>
                <select
                  value={role}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRole(val);
                    if (val === "super_admin") {
                      setAgenceId("");
                    }
                  }}
                  className="w-full bg-background/20 border border-border rounded-none px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
                  disabled={currentUser?.role === "manager"}
                  required
                >
                  <option value="agent">Agent (Logistique terrain)</option>
                  {currentUser?.role === "super_admin" && (
                    <>
                      <option value="manager">Manager d'Agence</option>
                      <option value="super_admin">Super Administrateur</option>
                    </>
                  )}
                </select>
              </div>

              {/* Agency selection */}
              {role !== "super_admin" && (
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-1.5">
                    Agence affectée
                  </label>
                  <select
                    value={agenceId}
                    onChange={(e) => setAgenceId(e.target.value)}
                    className="w-full bg-background/20 border border-border rounded-none px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150"
                    disabled={currentUser?.role === "manager"}
                  >
                    <option value="">Non affectée (Hors agence)</option>
                    {agencies.map(a => (
                      <option key={a.id} value={a.id}>{a.nom}</option>
                    ))}
                  </select>
                </div>
              )}

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
                  Compte actif
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
