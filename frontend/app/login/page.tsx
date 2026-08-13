'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser } from "../../context/UserContext";
import { AlertCircle, Lock, Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Veuillez saisir une adresse email valide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
});

type LoginFields = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { user, isLoading, login } = useUser();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const onSubmit = async (data: LoginFields) => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setErrorMsg(err?.message || "Identifiants de connexion invalides.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 rounded-none border border-border border-t-hes-red animate-spin" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left Panel: Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:flex-none lg:w-[480px] bg-white border-r border-border z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Brand header */}
          <div className="mb-10 text-center lg:text-left">
            <img src="/logo.png" alt="H.E.S Logo" className="w-16 h-16 mb-4 object-contain mx-auto lg:mx-0" />
            <h1 className="text-3xl font-title font-bold tracking-wider leading-none text-hes-blue">
              HORIZON EXPRESS
            </h1>
            <p className="text-[10px] text-hes-red font-mono font-bold tracking-widest mt-2 uppercase">
              SERVICES
            </p>
            <h2 className="mt-8 text-xl font-title font-bold text-foreground tracking-tight uppercase">
              CONTRÔLE D'ACCÈS
            </h2>
            <p className="mt-2 text-xs text-hes-textMuted font-medium">
              Veuillez renseigner vos accès professionnels de tournée
            </p>
          </div>

          {errorMsg && (
            <div className="bg-white border border-hes-red text-hes-red p-4 rounded-sm mb-6 text-xs font-mono uppercase tracking-wider flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">
                Identifiant Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-hes-textMuted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  {...register("email")}
                  className={`w-full bg-background/20 border rounded-sm pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150 ${
                    errors.email ? "border-hes-red focus:ring-hes-red" : "border-border"
                  }`}
                  placeholder="nom@hes-express.com"
                  disabled={submitting}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-hes-red font-semibold mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-hes-textMuted tracking-widest mb-2">
                Clé d'accès
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-hes-textMuted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  {...register("password")}
                  className={`w-full bg-background/20 border rounded-sm pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-hes-blue focus:bg-white transition-all duration-150 ${
                    errors.password ? "border-hes-red focus:ring-hes-red" : "border-border"
                  }`}
                  placeholder="••••••••"
                  disabled={submitting}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-hes-red font-semibold mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-8 py-3.5 bg-hes-red hover:bg-hes-red/90 disabled:bg-hes-red/50 text-white rounded-sm font-title font-bold tracking-wider text-xs uppercase transition-all duration-150 shadow-none flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 rounded-none border border-white/20 border-t-white animate-spin" />
                  <span>Validation en cours...</span>
                </>
              ) : (
                <span>Valider l'Accès</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel: Corporate Design */}
      <div className="hidden lg:block relative flex-1 bg-hes-blue overflow-hidden border-l border-border/10">
        {/* Background Image with Cobalt Blue Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 hover:scale-105" 
          style={{ backgroundImage: "url('/logistics_bg.png')" }} 
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-hes-blue/90 via-hes-blue/85 to-transparent opacity-90 mix-blend-multiply" />
        
        <div className="absolute inset-0 flex flex-col justify-center px-16 text-white max-w-2xl z-10">
          <span className="text-[10px] font-mono font-bold tracking-widest text-hes-red uppercase">
            HORIZON EXPRESS SERVICES
          </span>
          <h2 className="text-4xl font-title font-bold mt-4 leading-tight tracking-wider uppercase">
            EFFICACITÉ.<br />
            TRAÇABILITÉ.<br />
            FIABILITÉ.
          </h2>
          <p className="mt-6 text-white/70 font-sans text-sm leading-relaxed">
            Système d'émargement et d'archivage des tournées de ramassages logistiques. Suivi des colis en temps réel pour l'ensemble des agences du réseau national H.E.S.
          </p>
          
          <div className="mt-12 flex gap-6 text-[10px] font-mono text-white/55 font-bold border-t border-white/10 pt-8 uppercase tracking-widest">
            <div>
              <p className="text-white font-title text-base font-bold leading-none">100%</p>
              <p className="mt-1">Traçable</p>
            </div>
            <div className="border-l border-white/10 pl-6">
              <p className="text-white font-title text-base font-bold leading-none">JWT SECURE</p>
              <p className="mt-1">Chiffrement</p>
            </div>
            <div className="border-l border-white/10 pl-6">
              <p className="text-white font-title text-base font-bold leading-none">MANIFESTE</p>
              <p className="mt-1">PDF à la volée</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
