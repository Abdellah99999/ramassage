'use client';

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiFetch } from "../../../lib/api";
import { 
  ArrowLeft, 
  Plus, 
  Lock, 
  CheckCircle, 
  Calendar,
  User,
  Package,
  AlertTriangle,
  AlertCircle,
  Printer
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const pickupSchema = z.object({
  numero_declaration: z.string().min(1, "Le numéro BL est requis").regex(/^\d+$/, "Le numéro BL ne doit contenir que des chiffres"),
  client_nom: z.string().min(1, "Le nom du client est requis"),
  client_telephone: z.string().optional(),
  adresse: z.string().min(1, "L'adresse est requise"),
  ville: z.string().min(1, "La ville est requise"),
  nombre_colis: z.coerce.number().int().min(1, "Le nombre de colis doit être supérieur à 0"),
  date: z.string().min(1, "La date est requise"),
  heure: z.string().min(1, "L'heure est requise"),
  observations: z.string().optional(),
});

type PickupFormFields = z.infer<typeof pickupSchema>;

export default function BordereauDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slipId = parseInt(resolvedParams.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch slip details
  const { data: slip, isLoading, error } = useQuery<any>({
    queryKey: ["pickup-slip", slipId],
    queryFn: () => apiFetch(`/api/v1/pickup-slips/${slipId}`),
  });

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PickupFormFields>({
    resolver: zodResolver(pickupSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      heure: new Date().toTimeString().slice(0, 5),
      nombre_colis: 1,
    }
  });

  // Add Pickup Mutation
  const addPickupMutation = useMutation({
    mutationFn: (data: PickupFormFields) => {
      const formattedData = {
        ...data,
        heure: data.heure.length === 5 ? `${data.heure}:00` : data.heure,
        pickup_slip_id: slipId
      };
      return apiFetch(`/api/v1/pickup-slips/${slipId}/pickups`, {
        method: "POST",
        body: JSON.stringify(formattedData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-slip", slipId] });
      queryClient.invalidateQueries({ queryKey: ["pickup-slips"] });
      reset({
        numero_declaration: "",
        client_nom: "",
        client_telephone: "",
        adresse: "",
        ville: "",
        nombre_colis: 1,
        date: new Date().toISOString().split("T")[0],
        heure: new Date().toTimeString().slice(0, 5),
        observations: ""
      });
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Impossible d'ajouter le ramassage.");
    }
  });

  // Close Slip Mutation
  const closeSlipMutation = useMutation({
    mutationFn: () => {
      return apiFetch(`/api/v1/pickup-slips/${slipId}/close`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-slip", slipId] });
      queryClient.invalidateQueries({ queryKey: ["pickup-slips"] });
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Impossible de clôturer le bordereau.");
    }
  });

  const onAddPickupSubmit = (data: PickupFormFields) => {
    addPickupMutation.mutate(data);
  };

  const handleCloseSlip = () => {
    if (window.confirm("Êtes-vous sûr de vouloir clôturer ce bordereau ? Cette action verrouillera l'ajout de ramassages.")) {
      closeSlipMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[80vh] bg-background">
        <div className="w-10 h-10 rounded-none border border-border border-t-slate-800 animate-spin mb-4" />
        <p className="text-hes-textMuted text-xs font-mono tracking-widest uppercase">Chargement du manifeste...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto bg-background">
        <div className="bg-white border border-hes-red p-8 text-center text-hes-red rounded-none">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-hes-red" />
          <p className="font-title font-bold text-sm uppercase">Erreur de chargement</p>
          <p className="text-xs font-mono mt-1 text-hes-red">{(error as any)?.message || "Le bordereau est introuvable."}</p>
          <Link href="/bordereaux" className="mt-4 inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-800 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Retour aux manifestes
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = slip.statut === "clôturé";
  const totalColis = slip.pickups.reduce((acc: number, p: any) => acc + p.nombre_colis, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-background text-foreground font-sans">
      {/* Back Button & Title */}
      <div className="space-y-4">
        <Link 
          href="/bordereaux"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-hes-textMuted hover:text-foreground transition uppercase tracking-wider group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" /> 
          <span>Retour aux bordereaux</span>
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-title font-bold tracking-tight text-foreground">
                {slip.numero_bordereau}
              </h1>
              <span className={isClosed ? "text-hes-green hes-stamp" : "text-hes-red hes-stamp"}>
                {slip.statut}
              </span>
            </div>
            <p className="text-hes-textMuted text-xs font-mono mt-2.5 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-slate-400" />
              Tournée du {new Date(slip.date_tournee).toLocaleDateString("fr-FR")} à {slip.heure_debut.slice(0, 5)}
              {slip.heure_fin && ` - Clôturé à ${slip.heure_fin.slice(0, 5)}`}
            </p>
          </div>

          <a
            href={`/api/v1/pickup-slips/${slip.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-hes-blue hover:bg-hes-blue/90 text-white rounded-md text-xs font-mono font-bold uppercase tracking-wider shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer PDF</span>
          </a>
        </div>
      </div>

      {/* Ribbon */}
      <div className="hes-ribbon !mt-0 !mb-8" />

      {errorMessage && (
        <div className="bg-white border border-hes-red text-hes-red p-4 rounded-none text-xs font-mono uppercase tracking-wider flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Pickups List Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-hes-textMuted" />
                <h2 className="font-title font-bold text-xs text-foreground uppercase tracking-wider">
                  Colis ramassés ({slip.pickups.length})
                </h2>
              </div>
              <span className="text-xs bg-background/40 text-foreground border border-border rounded-none px-3.5 py-1.5 font-mono font-bold">
                Total Colis : {totalColis}
              </span>
            </div>

            {slip.pickups.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-none">
                <Package className="w-12 h-12 text-border mx-auto mb-4" />
                <h3 className="text-md font-title font-bold text-foreground mb-1 uppercase tracking-wider">AUCUN COLIS ENREGISTRÉ</h3>
                <p className="text-hes-textMuted text-xs font-mono max-w-xs mx-auto">Veuillez renseigner des ramassages de colis via le formulaire de droite.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest">
                      <th className="pb-3 pr-4">N° BL</th>
                      <th className="pb-3 pr-4">Client</th>
                      <th className="pb-3 pr-4">Adresse</th>
                      <th className="pb-3 pr-4">Ville</th>
                      <th className="pb-3 pr-4">Heure</th>
                      <th className="pb-3 text-right">Colis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/45 text-sm text-slate-700">
                    {slip.pickups.map((p: any) => (
                      <tr key={p.id} className="hover:bg-background/20 transition">
                        <td className="py-3.5 pr-4 font-mono font-bold text-slate-900">{p.numero_declaration}</td>
                        <td className="py-3.5 pr-4 font-semibold text-slate-800">{p.client_nom}</td>
                        <td className="py-3.5 pr-4 text-xs text-hes-textMuted max-w-[150px] truncate" title={p.adresse}>
                          {p.adresse}
                        </td>
                        <td className="py-3.5 pr-4 font-medium">{p.ville}</td>
                        <td className="py-3.5 pr-4 text-xs font-mono text-hes-textMuted">
                          {p.heure.slice(0, 5)}
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-slate-900">{p.nombre_colis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Summary & Form */}
        <div className="space-y-6">
          {/* Tour Summary Card */}
          <div className="bg-white rounded-none border border-border p-6 shadow-none">
            <h3 className="font-title font-bold text-xs text-foreground uppercase tracking-wider mb-5 border-b border-border pb-3 flex items-center gap-1.5">
              <User className="w-4 h-4 text-hes-textMuted" /> Détails Tournée
            </h3>
            
            <div className="space-y-4 text-sm font-sans">
              <div className="flex justify-between items-center">
                <span className="text-hes-textMuted font-medium">Chauffeur :</span>
                <span className="font-bold text-foreground">{slip.driver.nom}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-hes-textMuted font-medium">Agence :</span>
                <span className="font-bold text-foreground">{slip.agency.nom}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-hes-textMuted font-medium">Statut :</span>
                <span className="font-bold text-foreground capitalize">{slip.statut}</span>
              </div>
                <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
                <span className="text-hes-textMuted font-medium">Total Ramassages :</span>
                <span className="font-mono font-bold text-foreground">{slip.pickups.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-hes-textMuted font-medium">Total Colis :</span>
                <span className="font-mono font-bold text-hes-red">{totalColis}</span>
              </div>
            </div>
          </div>

          {/* Add Pickup Form Card */}
          <div className="bg-white rounded-lg border border-border overflow-hidden shadow-sm">
            {isClosed ? (
              <div className="p-8 text-center text-slate-500 space-y-3 bg-background/20">
                <Lock className="w-6 h-6 mx-auto text-hes-textMuted" />
                <h3 className="font-title font-bold text-xs text-foreground uppercase tracking-wider">MANIFESTE CLÔTURÉ</h3>
                <p className="text-xs font-mono text-hes-textMuted max-w-[200px] mx-auto leading-relaxed">Les saisies logistiques sont verrouillées sur cette feuille d'émargement.</p>
              </div>
            ) : (
              <div className="p-6">
                <h3 className="font-title font-bold text-xs text-foreground uppercase tracking-wider mb-5 border-b border-border pb-3 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-hes-textMuted" /> Enregistrer un colis
                </h3>

                <form onSubmit={handleSubmit(onAddPickupSubmit)} className="space-y-4">
                  {/* N° Declaration */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">N° BL (Bon de Livraison) *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...register("numero_declaration")}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
                      }}
                      className={`w-full bg-background/20 border rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition-all duration-150 ${
                        errors.numero_declaration ? "border-hes-red focus:ring-hes-red" : "border-border"
                      }`}
                      placeholder="Ex: 123456"
                    />
                    {errors.numero_declaration && (
                      <p className="text-xs text-hes-red font-semibold mt-1.5">{errors.numero_declaration.message}</p>
                    )}
                  </div>

                  {/* Client name */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Nom du client *</label>
                    <input
                      type="text"
                      {...register("client_nom")}
                      className={`w-full bg-background/20 border rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150 ${
                        errors.client_nom ? "border-hes-red focus:ring-hes-red" : "border-border"
                      }`}
                      placeholder="Entreprise ou Client"
                    />
                    {errors.client_nom && (
                      <p className="text-xs text-hes-red font-semibold mt-1.5">{errors.client_nom.message}</p>
                    )}
                  </div>

                  {/* Client telephone */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Téléphone client</label>
                    <input
                      type="text"
                      {...register("client_telephone")}
                      className="w-full bg-background/20 border border-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition-all duration-150"
                      placeholder="Contact client"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Adresse *</label>
                    <input
                      type="text"
                      {...register("adresse")}
                      className={`w-full bg-background/20 border rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150 ${
                        errors.adresse ? "border-hes-red focus:ring-hes-red" : "border-border"
                      }`}
                      placeholder="Rue, Immeuble, Bureau"
                    />
                    {errors.adresse && (
                      <p className="text-xs text-hes-red font-semibold mt-1.5">{errors.adresse.message}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Ville *</label>
                    <input
                      type="text"
                      {...register("ville")}
                      className={`w-full bg-background/20 border rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150 ${
                        errors.ville ? "border-hes-red focus:ring-hes-red" : "border-border"
                      }`}
                      placeholder="Ville"
                    />
                    {errors.ville && (
                      <p className="text-xs text-hes-red font-semibold mt-1.5">{errors.ville.message}</p>
                    )}
                  </div>

                  {/* Date & Time & Colis Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Date *</label>
                      <input
                        type="date"
                        {...register("date")}
                        className="w-full bg-background/20 border border-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition-all duration-150"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Heure *</label>
                      <input
                        type="time"
                        {...register("heure")}
                        className="w-full bg-background/20 border border-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition-all duration-150"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Colis *</label>
                      <input
                        type="number"
                        {...register("nombre_colis")}
                        className={`w-full bg-background/20 border rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white font-mono transition-all duration-150 ${
                          errors.nombre_colis ? "border-hes-red focus:ring-hes-red" : "border-border"
                        }`}
                        min="1"
                      />
                      {errors.nombre_colis && (
                        <p className="text-xs text-hes-red font-semibold mt-1.5">{errors.nombre_colis.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Observations */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">Observations</label>
                    <textarea
                      {...register("observations")}
                      className="w-full bg-background/20 border border-border rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150 h-20 resize-none"
                      placeholder="Observations"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={addPickupMutation.isPending}
                    className="w-full py-3.5 bg-hes-red hover:bg-hes-red/90 disabled:bg-slate-300 text-white rounded-none font-title font-bold tracking-wider text-xs uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {addPickupMutation.isPending ? (
                      <div className="w-4 h-4 rounded-none border border-white/20 border-t-white animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>Ajouter au Manifeste</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
