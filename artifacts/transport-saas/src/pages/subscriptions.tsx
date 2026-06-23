import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useMe } from "@/hooks/useMe";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatFCFA, formatDate } from "@/lib/fcfa";
import { Crown, CheckCircle2, Building2, Plus, RefreshCw } from "lucide-react";

type Plan = "starter" | "business" | "enterprise";
type StatutAbonnement = "actif" | "expire" | "suspendu" | "essai";

interface Abonnement {
  id: number;
  plan: Plan;
  statut: StatutAbonnement;
  dateDebut: string;
  dateFin: string;
  prixMensuel: number;
  agencesMax: number;
  utilisateursMax: number;
  voyagesMax: number | null;
}

const PLANS: Record<Plan, { nom: string; prix: number; agences: number; utilisateurs: number; voyages: number | null; couleur: string; features: string[] }> = {
  starter: {
    nom: "Starter",
    prix: 15000,
    agences: 2,
    utilisateurs: 5,
    voyages: 100,
    couleur: "text-slate-600",
    features: ["2 agences", "5 utilisateurs", "100 voyages/mois", "SMS basiques", "Support email"],
  },
  business: {
    nom: "Business",
    prix: 45000,
    agences: 10,
    utilisateurs: 25,
    voyages: 500,
    couleur: "text-blue-600",
    features: ["10 agences", "25 utilisateurs", "500 voyages/mois", "SMS + WhatsApp", "Rapports avancés", "Support prioritaire"],
  },
  enterprise: {
    nom: "Enterprise",
    prix: 120000,
    agences: 999,
    utilisateurs: 999,
    voyages: null,
    couleur: "text-amber-600",
    features: ["Agences illimitées", "Utilisateurs illimités", "Voyages illimités", "Tous canaux notif.", "API dédiée", "SLA 99.9%"],
  },
};

const COULEUR_STATUT: Record<StatutAbonnement, string> = {
  actif: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  expire: "bg-red-500/10 text-red-600 border-red-200",
  suspendu: "bg-slate-500/10 text-slate-600 border-slate-200",
  essai: "bg-violet-500/10 text-violet-600 border-violet-200",
};

export default function Subscriptions() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: me } = useMe(true);
  const [ouvert, setOuvert] = useState(false);
  const [planChoisi, setPlanChoisi] = useState<Plan>("business");

  const { data: abonnements = [] } = useQuery({
    queryKey: ["/api/subscriptions"],
    queryFn: () => apiFetch<Abonnement[]>("/api/subscriptions"),
  });

  const compagnie = me?.company?.name ?? "Ma compagnie";
  const courant = abonnements[0];

  const revenus_mensuels = abonnements.filter(a => a.statut === "actif").reduce((s, a) => s + a.prixMensuel, 0);
  const actifs = abonnements.filter(a => a.statut === "actif").length;
  const essais = abonnements.filter(a => a.statut === "essai").length;

  const updateSubscription = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      apiFetch<Abonnement>(`/api/subscriptions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/subscriptions"] }),
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  function renouveler(a: Abonnement) {
    const dateFin = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
    updateSubscription.mutate(
      { id: a.id, body: { statut: "actif", dateFin } },
      { onSuccess: () => toast({ title: "Abonnement renouvelé pour 1 an" }) },
    );
  }

  function changerPlan() {
    if (!courant) return;
    const plan = PLANS[planChoisi];
    const body: Record<string, unknown> = {
      plan: planChoisi,
      prixMensuel: plan.prix,
      agencesMax: plan.agences,
      utilisateursMax: plan.utilisateurs,
    };
    if (plan.voyages != null) body.voyagesMax = plan.voyages;
    updateSubscription.mutate(
      { id: courant.id, body },
      {
        onSuccess: () => {
          toast({ title: `Plan ${plan.nom} attribué` });
          setOuvert(false);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Crown className="h-6 w-6 text-amber-500" /> Abonnement SaaS
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Votre plan et les options disponibles</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Revenus mensuels</p>
          <p className="text-2xl font-bold text-emerald-600">{formatFCFA(revenus_mensuels)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Abonnements actifs</p>
          <p className="text-2xl font-bold">{actifs}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Essais en cours</p>
          <p className="text-2xl font-bold text-violet-600">{essais}</p>
        </CardContent></Card>
      </div>

      {/* Grille des plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.entries(PLANS) as [Plan, typeof PLANS[Plan]][]).map(([planKey, plan]) => (
          <Card key={planKey} className={planKey === courant?.plan ? "border-primary/40 shadow-md" : ""}>
            <CardHeader className="pb-3">
              {planKey === courant?.plan && (
                <Badge className="w-fit mb-2 bg-primary text-primary-foreground">Plan actuel</Badge>
              )}
              <CardTitle className={`text-xl ${plan.couleur}`}>{plan.nom}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">{formatFCFA(plan.prix)}</span>
                <span className="text-muted-foreground">/mois</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Abonnement de la compagnie */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mon abonnement</CardTitle>
          <Button size="sm" disabled={!courant} onClick={() => { if (courant) setPlanChoisi(courant.plan); setOuvert(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Changer de plan
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compagnie</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Tarif mensuel</TableHead>
                <TableHead>Limites</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {abonnements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucun abonnement</TableCell>
                </TableRow>
              ) : (
                abonnements.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{compagnie}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${PLANS[a.plan].couleur}`}>{PLANS[a.plan].nom}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={COULEUR_STATUT[a.statut]}>
                        {a.statut.charAt(0).toUpperCase() + a.statut.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(a.dateDebut)}</TableCell>
                    <TableCell className="text-sm">{formatDate(a.dateFin)}</TableCell>
                    <TableCell className="font-medium">{a.statut === "essai" ? "Gratuit" : formatFCFA(a.prixMensuel)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.agencesMax === 999 ? "∞" : a.agencesMax} agences · {a.utilisateursMax === 999 ? "∞" : a.utilisateursMax} users
                    </TableCell>
                    <TableCell className="text-right">
                      {(a.statut === "expire" || a.statut === "essai") && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={updateSubscription.isPending} onClick={() => renouveler(a)}>
                          <RefreshCw className="h-3 w-3" /> Renouveler
                        </Button>
                      )}
                      {a.statut === "actif" && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1 justify-end">
                          <CheckCircle2 className="h-3 w-3" /> Actif
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Changer de plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Plan</Label>
              <Select value={planChoisi} onValueChange={(v) => setPlanChoisi(v as Plan)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(PLANS) as [Plan, typeof PLANS[Plan]][]).map(([k, p]) => (
                    <SelectItem key={k} value={k}>{p.nom} — {formatFCFA(p.prix)}/mois</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted/50 border p-3 text-sm space-y-1">
              {PLANS[planChoisi].features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{f}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOuvert(false)}>Annuler</Button>
            <Button disabled={!courant || updateSubscription.isPending} onClick={changerPlan}>
              {updateSubscription.isPending ? "…" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
