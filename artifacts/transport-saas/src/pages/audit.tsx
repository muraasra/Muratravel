import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
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
  Activity,
} from "lucide-react";

type ActionType = "connexion" | "deconnexion" | "creation" | "modification" | "suppression" | "consultation" | "export";

interface LogEntry {
  id: number;
  action: string;
  module: string;
  description: string;
  userName: string | null;
  userEmail: string | null;
  ipAddress: string | null;
  statut: "succes" | "echec";
  createdAt: string;
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

const DEFAUT_COULEUR = "bg-slate-500/10 text-slate-600 border-slate-200";

export default function Audit() {
  const [recherche, setRecherche] = useState("");
  const [filtreAction, setFiltreAction] = useState("tout");
  const [filtreStatut, setFiltreStatut] = useState("tout");

  const { data: tousLogs = [], isLoading } = useQuery({
    queryKey: ["/api/audit"],
    queryFn: () => apiFetch<LogEntry[]>("/api/audit"),
  });

  const logs = tousLogs.filter((l) => {
    const matchRecherche = !recherche ||
      l.description.toLowerCase().includes(recherche.toLowerCase()) ||
      (l.userName ?? "").toLowerCase().includes(recherche.toLowerCase()) ||
      (l.userEmail ?? "").toLowerCase().includes(recherche.toLowerCase());
    const matchAction = filtreAction === "tout" || l.action === filtreAction;
    const matchStatut = filtreStatut === "tout" || l.statut === filtreStatut;
    return matchRecherche && matchAction && matchStatut;
  });

  const stats = {
    total: tousLogs.length,
    connexions: tousLogs.filter(l => l.action === "connexion").length,
    echecs: tousLogs.filter(l => l.statut === "echec").length,
    utilisateurs_uniques: new Set(tousLogs.map(l => l.userEmail).filter(Boolean)).size,
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Chargement…</TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun résultat</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className={log.statut === "echec" ? "bg-red-50/30" : ""}>
                    <TableCell>
                      <Badge variant="outline" className={`${COULEUR_ACTION[log.action as ActionType] ?? DEFAUT_COULEUR} gap-1 text-xs`}>
                        {ICONE_ACTION[log.action as ActionType] ?? <Activity className="h-3.5 w-3.5" />}
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{log.module}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm">{log.description}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{log.userName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{log.userEmail ?? ""}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.ipAddress ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={log.statut === "succes" ? "default" : "destructive"} className="text-xs">
                        {log.statut === "succes" ? "Succès" : "Échec"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateHeure(log.createdAt)}</TableCell>
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
