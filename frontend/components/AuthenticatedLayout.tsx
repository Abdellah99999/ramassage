'use client';

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import Sidebar from "./Sidebar";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-hes-blue/20 border-t-hes-blue animate-spin mb-4" />
        <p className="text-foreground font-semibold text-xs tracking-wider uppercase animate-pulse">
          Chargement de votre session...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 min-h-screen transition-all duration-200">
        {children}
      </main>
    </div>
  );
}
