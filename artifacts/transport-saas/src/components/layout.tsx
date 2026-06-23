import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3, Bus, Building2, CreditCard, LayoutDashboard, Luggage, Map, Navigation,
  Settings, Ticket, Users, Briefcase, ScanLine, AlertTriangle, Bell, Shield, Wallet,
  Crown, LogOut, ChevronDown, Menu, X, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMe } from "@/hooks/useMe";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navGroupes = [
  { titre: "Vue d'ensemble", items: [{ titre: "Tableau de bord", href: "/", icon: LayoutDashboard }] },
  { titre: "Opérations", items: [
    { titre: "Voyages", href: "/trips", icon: Navigation },
    { titre: "Réservations", href: "/reservations", icon: Ticket },
    { titre: "Réservation en ligne", href: "/booking", icon: Globe },
    { titre: "Embarquement", href: "/boarding", icon: ScanLine },
    { titre: "Bagages", href: "/baggage", icon: Luggage },
  ] },
  { titre: "Flotte", items: [
    { titre: "Véhicules", href: "/vehicles", icon: Bus },
    { titre: "Destinations", href: "/destinations", icon: Map },
  ] },
  { titre: "Finance", items: [
    { titre: "Paiements", href: "/payments", icon: CreditCard },
    { titre: "Journal de caisse", href: "/finance", icon: Wallet },
    { titre: "Rapports", href: "/reports", icon: BarChart3 },
  ] },
  { titre: "Administration", items: [
    { titre: "Compagnies", href: "/companies", icon: Building2 },
    { titre: "Agences", href: "/agencies", icon: Briefcase },
    { titre: "Utilisateurs", href: "/users", icon: Users },
    { titre: "Abonnements", href: "/subscriptions", icon: Crown },
  ] },
  { titre: "Sécurité & Support", items: [
    { titre: "Incidents", href: "/incidents", icon: AlertTriangle },
    { titre: "Notifications", href: "/notifications", icon: Bell },
    { titre: "Audit & Logs", href: "/audit", icon: Shield },
  ] },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const { data: me } = useMe(true);

  const initiales = user?.email?.slice(0, 2).toUpperCase() ?? "??";
  const nomAffiche = me?.name ?? user?.user_metadata?.full_name ?? user?.email ?? "Utilisateur";
  const roleAffiche = me?.company?.name ?? "Ma compagnie";

  return (
    <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground">
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border flex-shrink-0">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center mr-3">
          <Bus className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="font-bold text-lg tracking-tight">MuraTravel</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {navGroupes.map((group, i) => (
          <div key={i} className="mb-5 px-3">
            <h2 className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1">{group.titre}</h2>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={onNavigate}
                    className={cn("flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                      isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
                    <Icon className={cn("mr-3 h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "")} />
                    {item.titre}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-sidebar-border flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent/50 transition-colors text-left">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : initiales}
              </div>
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-medium truncate">{nomAffiche}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{roleAffiche}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/40 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52 mb-1">
            <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user?.email}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer" onClick={onNavigate}><Settings className="h-4 w-4 mr-2" /> Mon compte &amp; 2FA</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/audit" className="cursor-pointer" onClick={onNavigate}><Shield className="h-4 w-4 mr-2" /> Audit &amp; Logs</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: me } = useMe(true);

  return (
    // h-screen + overflow-hidden: the page itself never scrolls or shifts — only
    // the inner content panel scrolls, and only the sidebar can move (drawer).
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r border-sidebar-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80%] shadow-xl animate-in slide-in-from-left">
            <button className="absolute -right-10 top-3 text-white p-2" onClick={() => setDrawerOpen(false)} aria-label="Fermer">
              <X className="h-6 w-6" />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden p-1.5 -ml-1.5 rounded hover:bg-muted" onClick={() => setDrawerOpen(true)} aria-label="Ouvrir le menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center"><Bus className="w-4 h-4 text-primary-foreground" /></div>
              <span className="font-bold">MuraTravel</span>
            </div>
            <span className="hidden md:inline text-sm font-medium text-muted-foreground truncate">
              {me?.company?.name ? `${me.company.name} — Gestion Transport` : "MuraTravel — Gestion Transport & Voyages"}
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <span className="hidden sm:inline text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
              {me?.company?.currency ?? "XOF"} · FCFA
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-muted/20" style={{ scrollbarGutter: "stable" }}>
          <div className="p-4 md:p-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
