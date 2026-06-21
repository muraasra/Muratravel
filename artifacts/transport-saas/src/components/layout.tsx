import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Bus,
  Building2,
  CreditCard,
  LayoutDashboard,
  Map,
  Navigation,
  Settings,
  Ticket,
  Users,
  Briefcase,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const navGroupes = [
  {
    titre: "Vue d'ensemble",
    items: [{ titre: "Tableau de bord", href: "/", icon: LayoutDashboard }],
  },
  {
    titre: "Opérations",
    items: [
      { titre: "Voyages", href: "/trips", icon: Navigation },
      { titre: "Réservations", href: "/reservations", icon: Ticket },
      { titre: "Embarquement", href: "/boarding", icon: ScanLine },
    ],
  },
  {
    titre: "Flotte",
    items: [
      { titre: "Véhicules", href: "/vehicles", icon: Bus },
      { titre: "Destinations", href: "/destinations", icon: Map },
    ],
  },
  {
    titre: "Finance",
    items: [
      { titre: "Paiements", href: "/payments", icon: CreditCard },
      { titre: "Rapports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    titre: "Administration",
    items: [
      { titre: "Compagnies", href: "/companies", icon: Building2 },
      { titre: "Agences", href: "/agencies", icon: Briefcase },
      { titre: "Utilisateurs", href: "/users", icon: Users },
    ],
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex-shrink-0 flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center mr-3">
            <Bus className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">TransportHub</h1>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {navGroupes.map((group, i) => (
            <div key={i} className="mb-6 px-3">
              <h2 className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                {group.titre}
              </h2>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    location === item.href ||
                    (item.href !== "/" && location.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "mr-3 h-4 w-4",
                          isActive ? "text-primary" : ""
                        )}
                      />
                      {item.titre}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-sidebar-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium">
              AD
            </div>
            <div className="text-sm">
              <p className="font-medium">Amadou Diallo</p>
              <p className="text-xs text-sidebar-foreground/50">Administrateur</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center text-sm font-medium text-muted-foreground">
            TransportHub — Gestion Transport & Voyages
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
              XOF · FCFA
            </span>
            <Button size="sm" className="h-8">
              + Action rapide
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-muted/20">
          <div className="p-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
