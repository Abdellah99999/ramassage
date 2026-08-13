'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "../context/UserContext";
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Truck, 
  Building2, 
  Users, 
  LogOut,
  Search,
  Printer
} from "lucide-react";
import { cn } from "../lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useUser();

  const baseLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/bordereaux", label: "Bordereaux", icon: FileText },
    { href: "/historique", label: "Historique", icon: Search },
    { href: "/impression", label: "Impression", icon: Printer },
    { href: "/chauffeurs", label: "Chauffeurs", icon: Truck },
  ];

  const links = [...baseLinks];
  if (user?.role === "super_admin") {
    links.push({ href: "/agences", label: "Agences", icon: Building2 });
    links.push({ href: "/utilisateurs", label: "Utilisateurs", icon: Users });
  }

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    manager: "Manager",
    agent: "Agent"
  };

  return (
    <aside className="w-64 bg-card text-foreground flex flex-col h-screen fixed left-0 top-0 border-r border-border z-30 font-sans">
      {/* Brand Header */}
      <div className="p-5 border-b border-border/50 flex items-center gap-3">
        <img src="/logo.png" alt="H.E.S Logo" className="w-9 h-9 object-contain flex-shrink-0" />
        <div>
          <h2 className="font-title font-bold text-sm tracking-tight text-foreground leading-none">Horizon Express</h2>
          <span className="text-[11px] text-muted-foreground uppercase block">Services</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-150 rounded-md",
                isActive 
                  ? "bg-primary/10 text-primary ml-1"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer User Profile & Logout */}
      {user && (
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center font-bold text-sm rounded-full">
              {user.nom.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.nom}</p>
              <p className="text-xs text-muted-foreground truncate">{roleLabels[user.role] || user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-border text-sm rounded-md text-foreground hover:shadow-sm transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
