import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateHeure } from "@/lib/fcfa";
import {
  Shield,
  Search,
  UserCheck,
  LogIn,
  LogOut,
  Edit,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";

type ActionType = "connexion" | "deconnexion" | "creation" | "modification" | "suppression" | "consultation" | "export";

interface LogEntry {
  id: number;
  action: ActionType;
  module: string;
  description: string;
  utilisateur: string;
  email: string;
  ip: string;
  date: string;
  statut: "succes" | "echec";
}

const ICONE_ACTION: Record<ActionType, React.ReactNode> = {
  connexion: <LogIn className="h-3.5 w-3.5" />,
  deconnexion: <LogOut className="h-3.5 w-3.5" />,
  creation: <Plus className="h-3.5 w-3.5" />,
  modification: <Edit className="h-3.5 w-3.5" />,
  suppression: <Trash2 className="h-3.5 w-3.5" />,
  consultation: <Eye className="h-3.5 w-3.5" />,
  export: <RefreshCw className="h-3.5 w-3.5" />,
};

const COULEUR_ACTION: Record<ActionType, string> = {
  connexion: "bg-blue-500/10 text-blue-600 border-blue-200",
  deconnexion: "bg-slate-500/10 text-slate-600 border-slate-200",
  creation: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  modification: "bg-amber-500/10 text-amber-600 border-amber-200",
  suppression: "bg-red-500/10 text-red-600 border-red-200",
  consultation: "bg-violet-500/10 text-violet-600 border-violet-200",
  export: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
};

const logsMock: LogEntry[] = [
  { id: 1, action: "connexion", module: "Auth", description: "Connexion via Google OAuth", utilisateur: "Amadou Diallo", email: "amadou@muravoyages.com", ip: "41.82.12.45", date: new Date(Date.now() - 300000).toISOString(), statut: "succes" },
  { id: 2, action: "creation", module: "Réservations", description: "Nouvelle réservation TKT-A1B2C3 créée — Mamadou Ndiaye", utilisateur: "Fatou Sarr", email: "fatou@muravoyages.com", ip: "41.82.12.46", date: new Date(Date.now() - 600000).toISOString(), statut: "succes" },
  { id: 3, action: "modification", module: "Voyages", description: "Statut voyage VYG-2024-001 → Embarquement", utilisateur: "Ibrahima Sy", email: "ibrahima@muravoyages.com", ip: "196.10.15.72", date: new Date(Date.now() - 1800000).toISOString(), statut: "succes" },
  { id: 4, action: "connexion", module: "Auth", description: "Tentative de connexion échouée — mot de passe incorrect", utilisateur: "Inconnu", email: "hacker@test.com", ip: "192.168.1.1", date: new Date(Date.now() - 3600000).toISOString(), statut: "echec" },
  { id: 5, action: "export", module: "Rapports", description: "Export PDF rapport mensuel juin 2024", utilisateur: "Amadou Diallo", email: "amadou@muravoyages.com", ip: "41.82.12.45", date: new Date(Date.now() - 7200000).toISOString(), statut: "succes" },
  { id: 6, action: "suppression", module: "Véhicules", description: "Suppression véhicule AB-5678 (retraité)", utilisateur: "Admin Système", email: "admin@muravoyages.com", ip: "127.0.0.1", date: new Date(Date.now() - 86400000).toISOString(), statut: "succes" },
  { id: 7, action: "modification", module: "Compagnies", description: "Mise à jour logo compagnie MuraVoyages", utilisateur: "Amadou Diallo", email: "amadou@muravoyages.com", ip: "41.82.12.45", date: new Date(Date.now() - 172800000).toISOString(), statut: "succes" },
  { id: 8, action: "deconnexion", module: "Auth", description: "Déconnexion utilisateur", utilisateur: "Fatou Sarr", email: "fatou@muravoyages.com", ip: "41.82.12.46", date: new Date(Date.now() - 86400000).toISOString(), statut: "succes" },
];

export default function Audit() {
  const [recherche, setRecherche] = useState("");
  const [filtreAction, setFiltreAction] = useState("tout");
  const [filtreStatut, setFiltreStatut] = useState("tout");

  const logs = logsMock.filter((l) => {
    const matchRecherche = !recherche ||
      l.description.toLowerCase().includes(recherche.toLowerCase()) ||
      l.utilisateur.toLowerCase().includes(recherche.toLowerCase()) ||
      l.email.toLowerCase().includes(recherche.toLowerCase());
    const matchAction = filtreAction === "tout" || l.action === filtreAction;
    const matchStatut = filtreStatut === "tout" || l.statut === filtreStatut;
    return matchRecherche && matchAction && matchStatut;
  });

  const stats = {
    total: logsMock.length,
    connexions: logsMock.filter(l => l.action === "connexion").length,
    echecs: logsMock.filter(l => l.statut === "echec").length,
    utilisateurs_uniques: new Set(logsMock.map(l => l.email)).size,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Audit & Sécurité
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Historique complet des actions et journal de connexion</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Événements total", value: stats.total, color: "" },
          { label: "Connexions", value: stats.connexions, color: "text-blue-600" },
          { label: "Tentatives échouées", value: stats.echecs, color: "text-red-600" },
          { label: "Utilisateurs actifs", value: stats.utilisateurs_uniques, color: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" /> Journal des actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Rechercher…" value={recherche} onChange={e => setRecherche(e.target.value)} />
            </div>
            <Select value={filtreAction} onValueChange={setFiltreAction}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tout">Toutes actions</SelectItem>
                <SelectItem value="connexion">Connexion</SelectItem>
                <SelectItem value="deconnexion">Déconnexion</SelectItem>
                <SelectItem value="creation">Création</SelectItem>
                <SelectItem value="modification">Modification</SelectItem>
                <SelectItem value="suppression">Suppression</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtreStatut} onValueChange={setFiltreStatut}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tout">Tout statut</SelectItem>
                <SelectItem value="succes">Succès</SelectItem>
                <SelectItem value="echec">Échec</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun résultat</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className={log.statut === "echec" ? "bg-red-50/30" : ""}>
                    <TableCell>
                      <Badge variant="outline" className={`${COULEUR_ACTION[log.action]} gap-1 text-xs`}>
                        {ICONE_ACTION[log.action]}
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{log.module}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm">{log.description}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{log.utilisateur}</div>
                      <div className="text-xs text-muted-foreground">{log.email}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                    <TableCell>
                      <Badge variant={log.statut === "succes" ? "default" : "destructive"} className="text-xs">
                        {log.statut === "succes" ? "Succès" : "Échec"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateHeure(log.date)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
