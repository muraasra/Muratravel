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
  ScanLine
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const navGroups = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    title: "Operations",
    items: [
      { title: "Trips", href: "/trips", icon: Navigation },
      { title: "Reservations", href: "/reservations", icon: Ticket },
      { title: "Boarding", href: "/boarding", icon: ScanLine },
    ],
  },
  {
    title: "Fleet",
    items: [
      { title: "Vehicles", href: "/vehicles", icon: Bus },
      { title: "Destinations", href: "/destinations", icon: Map },
    ],
  },
  {
    title: "Finance",
    items: [
      { title: "Payments", href: "/payments", icon: CreditCard },
      { title: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Administration",
    items: [
      { title: "Companies", href: "/companies", icon: Building2 },
      { title: "Agencies", href: "/agencies", icon: Briefcase },
      { title: "Users", href: "/users", icon: Users },
    ],
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex-shrink-0 flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center mr-3">
            <Bus className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">TransportHub</h1>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {navGroups.map((group, i) => (
            <div key={i} className="mb-6 px-3">
              <h2 className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                {group.title}
              </h2>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
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
                      <Icon className={cn("mr-3 h-4 w-4", isActive ? "text-primary" : "")} />
                      {item.title}
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
              JD
            </div>
            <div className="text-sm">
              <p className="font-medium">John Doe</p>
              <p className="text-xs text-sidebar-foreground/50">Admin</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground/50 hover:text-sidebar-foreground">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center text-sm font-medium text-muted-foreground">
            {/* Breadcrumb would go here */}
            Overview
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="h-8 hidden md:flex">
              EN
            </Button>
            <Button size="sm" className="h-8">
              Quick Action
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-muted/20">
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}