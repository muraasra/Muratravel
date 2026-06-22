import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatDateHeure } from "@/lib/fcfa";
import { AlertTriangle, Plus, Luggage, MessageSquare, Clock, Truck } from "lucide-react";

type TypeIncident = "bagage_perdu" | "reclamation" | "retard" | "incident_vehicule";
type StatutIncident = "ouvert" | "en_cours" | "resolu" | "ferme";

interface Incident {
  id: number;
  type: TypeIncident;
  titre: string;
  description: string;
  statut: StatutIncident;
  priorite: "faible" | "normale" | "haute" | "critique";
  rapporte_par: string;
  voyage_ref?: string;
  date: string;
  date_resolution?: string;
}

const LABEL_TYPE: Record<TypeIncident, string> = {
  bagage_perdu: "Bagage perdu",
  reclamation: "Réclamation client",
  retard: "Retard de voyage",
  incident_vehicule: "Incident véhicule",
};

const ICONE_TYPE: Record<TypeIncident, React.ReactNode> = {
  bagage_perdu: <Luggage className="h-4 w-4" />,
  reclamation: <MessageSquare className="h-4 w-4" />,
  retard: <Clock className="h-4 w-4" />,
  incident_vehicule: <Truck className="h-4 w-4" />,
};

const COULEUR_STATUT: Record<StatutIncident, string> = {
  ouvert: "bg-red-500/10 text-red-600 border-red-200",
  en_cours: "bg-amber-500/10 text-amber-600 border-amber-200",
  resolu: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  ferme: "bg-slate-500/10 text-slate-600 border-slate-200",
};

const COULEUR_PRIORITE: Record<string, string> = {
  critique: "bg-red-500/10 text-red-700 border-red-200",
  haute: "bg-orange-500/10 text-orange-600 border-orange-200",
  normale: "bg-blue-500/10 text-blue-600 border-blue-200",
  faible: "bg-slate-500/10 text-slate-600 border-slate-200",
};

const incidentsMock: Incident[] = [
  { id: 1, type: "bagage_perdu", titre: "Valise perdue vol Dakar-Ziguinchor", description: "Le passager signale que sa valise noire n'a pas été retrouvée à l'arrivée.", statut: "en_cours", priorite: "haute", rapporte_par: "Mamadou Diallo", voyage_ref: "VYG-2024-001", date: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, type: "reclamation", titre: "Réclamation - Retard 2h", description: "Le client demande un remboursement partiel suite au retard de 2h du voyage.", statut: "ouvert", priorite: "normale", rapporte_par: "Fatou Ndiaye", date: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, type: "retard", titre: "Retard Bus AB-5678", description: "Retard de 45 minutes dû aux embouteillages à l'entrée de Thiès.", statut: "resolu", priorite: "faible", rapporte_par: "Ibrahima Sow", voyage_ref: "VYG-2024-002", date: new Date(Date.now() - 172800000).toISOString(), date_resolution: new Date(Date.now() - 86400000).toISOString() },
  { id: 4, type: "incident_vehicule", titre: "Crevaison Bus XY-9012", description: "Crevaison sur la route nationale 1 au km 45. Passagers transférés.", statut: "ferme", priorite: "critique", rapporte_par: "Ousmane Gueye", voyage_ref: "VYG-2024-003", date: new Date(Date.now() - 259200000).toISOString(), date_resolution: new Date(Date.now() - 172800000).toISOString() },
];

export default function Incidents() {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>(incidentsMock);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({
    type: "reclamation" as TypeIncident,
    titre: "",
    description: "",
    priorite: "normale" as Incident["priorite"],
    rapporte_par: "",
    voyage_ref: "",
  });

  const stats = {
    ouvert: incidents.filter(i => i.statut === "ouvert").length,
    en_cours: incidents.filter(i => i.statut === "en_cours").length,
    resolu: incidents.filter(i => i.statut === "resolu").length,
    critique: incidents.filter(i => i.priorite === "critique" && i.statut !== "ferme").length,
  };

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titre || !form.description || !form.rapporte_par) {
      toast({ title: "Champs requis manquants", variant: "destructive" });
      return;
    }
    const nouvelIncident: Incident = {
      id: Date.now(),
      ...form,
      statut: "ouvert",
      date: new Date().toISOString(),
    };
    setIncidents(prev => [nouvelIncident, ...prev]);
    toast({ title: "Incident déclaré avec succès" });
    setOuvert(false);
    setForm({ type: "reclamation", titre: "", description: "", priorite: "normale", rapporte_par: "", voyage_ref: "" });
  }

  function changerStatut(id: number, statut: StatutIncident) {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, statut, date_resolution: statut === "resolu" ? new Date().toISOString() : i.date_resolution } : i));
    toast({ title: `Incident mis à jour → ${statut}` });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Incidents</h1>
          <p className="text-muted-foreground text-sm mt-1">Bagages perdus, réclamations, retards et incidents véhicules</p>
        </div>
        <Button onClick={() => setOuvert(true)}>
          <Plus className="h-4 w-4 mr-2" /> Déclarer un incident
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Ouverts", value: stats.ouvert, color: "text-red-600" },
          { label: "En cours", value: stats.en_cours, color: "text-amber-600" },
          { label: "Résolus", value: stats.resolu, color: "text-emerald-600" },
          { label: "Critiques actifs", value: stats.critique, color: "text-red-700" },
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
        <CardHeader><CardTitle>Tous les incidents</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Rapporté par</TableHead>
                <TableHead>Voyage</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((inc) => (
                <TableRow key={inc.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      {ICONE_TYPE[inc.type]}
                      {LABEL_TYPE[inc.type]}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="font-medium truncate">{inc.titre}</p>
                    <p className="text-xs text-muted-foreground truncate">{inc.description}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={COULEUR_PRIORITE[inc.priorite]}>
                      {inc.priorite.charAt(0).toUpperCase() + inc.priorite.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={COULEUR_STATUT[inc.statut]}>
                      {inc.statut.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{inc.rapporte_par}</TableCell>
                  <TableCell className="font-mono text-xs">{inc.voyage_ref || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateHeure(inc.date)}</TableCell>
                  <TableCell className="text-right">
                    {inc.statut === "ouvert" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => changerStatut(inc.id, "en_cours")}>
                        Prendre en charge
                      </Button>
                    )}
                    {inc.statut === "en_cours" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-200" onClick={() => changerStatut(inc.id, "resolu")}>
                        Marquer résolu
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Déclarer un incident
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={soumettre} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type d'incident *</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as TypeIncident }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LABEL_TYPE).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priorité</Label>
                <Select value={form.priorite} onValueChange={(v) => setForm(f => ({ ...f, priorite: v as Incident["priorite"] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faible">Faible</SelectItem>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="critique">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Titre *</Label>
                <Input className="mt-1" placeholder="Résumé court de l'incident" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Description *</Label>
                <Textarea className="mt-1" rows={3} placeholder="Décrire l'incident en détail…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label>Rapporté par *</Label>
                <Input className="mt-1" placeholder="Nom de l'agent" value={form.rapporte_par} onChange={e => setForm(f => ({ ...f, rapporte_par: e.target.value }))} />
              </div>
              <div>
                <Label>Référence voyage</Label>
                <Input className="mt-1" placeholder="VYG-2024-xxx" value={form.voyage_ref} onChange={e => setForm(f => ({ ...f, voyage_ref: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOuvert(false)}>Annuler</Button>
              <Button type="submit">Déclarer l'incident</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
