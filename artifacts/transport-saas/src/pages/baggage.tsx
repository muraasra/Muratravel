import { useState } from "react";
import {
  useListBaggage,
  useCreateBaggage,
  useUpdateBaggage,
  useListReservations,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  formatFCFA,
  formatDateHeure,
  couleurStatutBagage,
  STATUT_BAGAGE,
  TYPE_BAGAGE,
  TARIF_BAGAGE,
} from "@/lib/fcfa";
import {
  Luggage,
  Plus,
  Package,
  Weight,
  ChevronRight,
  CheckCircle2,
  Truck,
  PackageCheck,
} from "lucide-react";

const FLUX_STATUT: Record<string, string | null> = {
  registered: "checked",
  checked: "loaded",
  loaded: "delivered",
  delivered: null,
};

const ICONE_STATUT: Record<string, React.ReactNode> = {
  registered: <Package className="h-3.5 w-3.5" />,
  checked: <CheckCircle2 className="h-3.5 w-3.5" />,
  loaded: <Truck className="h-3.5 w-3.5" />,
  delivered: <PackageCheck className="h-3.5 w-3.5" />,
};

const LABEL_AVANCER: Record<string, string> = {
  registered: "Vérifier",
  checked: "Charger",
  loaded: "Livrer",
};

export default function GestionBagages() {
  const { data: baggage, isLoading } = useListBaggage();
  const { data: reservations } = useListReservations();
  const createBaggage = useCreateBaggage();
  const updateBaggage = useUpdateBaggage();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({
    reservationId: "",
    type: "standard",
    weight: "",
    price: String(TARIF_BAGAGE["standard"]),
    notes: "",
  });

  const totalPoids = baggage?.reduce((s, b) => s + (b.weight ?? 0), 0) ?? 0;
  const totalFacture = baggage?.reduce((s, b) => s + (b.price ?? 0), 0) ?? 0;
  const nbEnCours = baggage?.filter((b) => b.status !== "delivered" && b.status !== "lost").length ?? 0;

  function changerType(type: string) {
    setForm((f) => ({ ...f, type, price: String(TARIF_BAGAGE[type] ?? 500) }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!form.reservationId || !form.weight) {
      toast({ title: "Réservation et poids requis", variant: "destructive" });
      return;
    }
    try {
      await createBaggage.mutateAsync({
        data: {
          reservationId: parseInt(form.reservationId),
          type: form.type as "standard" | "fragile" | "oversized" | "valuable",
          weight: parseFloat(form.weight),
          price: parseFloat(form.price),
          notes: form.notes || undefined,
          status: "registered",
        },
      });
      qc.invalidateQueries({ queryKey: ["/api/baggage"] });
      toast({ title: "Bagage enregistré avec succès" });
      setOuvert(false);
      setForm({ reservationId: "", type: "standard", weight: "", price: String(TARIF_BAGAGE["standard"]), notes: "" });
    } catch {
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    }
  }

  async function avancerStatut(id: number, statutActuel: string) {
    const prochain = FLUX_STATUT[statutActuel];
    if (!prochain) return;
    try {
      await updateBaggage.mutateAsync({ id, data: { status: prochain as "registered" | "checked" | "loaded" | "delivered" | "lost" | "damaged" } });
      qc.invalidateQueries({ queryKey: ["/api/baggage"] });
      toast({ title: `Bagage → ${STATUT_BAGAGE[prochain]}` });
    } catch {
      toast({ title: "Erreur de mise à jour", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Luggage className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bagages</h1>
            <p className="text-muted-foreground text-sm">Enregistrement, suivi et facturation des bagages</p>
          </div>
        </div>
        <Button onClick={() => setOuvert(true)}>
          <Plus className="h-4 w-4 mr-2" /> Enregistrer un bagage
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total bagages</p>
            <p className="text-3xl font-bold mt-1">{baggage?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">En transit</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{nbEnCours}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Poids total</p>
            <p className="text-3xl font-bold mt-1">{totalPoids.toFixed(1)} <span className="text-base font-normal text-muted-foreground">kg</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total facturé</p>
            <p className="text-xl font-bold mt-1">{formatFCFA(totalFacture)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Barre de progression du flux */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between max-w-2xl">
            {["registered", "checked", "loaded", "delivered"].map((s, i) => {
              const count = baggage?.filter((b) => b.status === s).length ?? 0;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-1 text-lg font-bold ${count > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {count}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{STATUT_BAGAGE[s]}</p>
                  </div>
                  {i < 3 && <ChevronRight className="h-5 w-5 text-muted-foreground/40 mx-1 mt-[-16px]" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les bagages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code de suivi</TableHead>
                <TableHead>Réservation</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Poids</TableHead>
                <TableHead>Facturation</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Enregistré le</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : baggage?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Aucun bagage enregistré
                  </TableCell>
                </TableRow>
              ) : (
                baggage?.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      {/* Affichage style code-barres */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex gap-px h-6">
                          {Array.from(b.trackingCode ?? "").map((c, i) => (
                            <div
                              key={i}
                              className="bg-foreground rounded-sm"
                              style={{
                                width: `${((c.charCodeAt(0) % 3) + 1) * 2}px`,
                                opacity: 0.7 + (i % 3) * 0.1,
                              }}
                            />
                          ))}
                        </div>
                        <span className="font-mono text-xs tracking-widest text-muted-foreground">
                          {b.trackingCode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">#{b.reservationId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Weight className="h-3.5 w-3.5 text-muted-foreground" />
                        {TYPE_BAGAGE[b.type] ?? b.type}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{b.weight ?? 0} kg</TableCell>
                    <TableCell className="font-semibold">{formatFCFA(b.price)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={couleurStatutBagage(b.status)}>
                        <span className="mr-1">{ICONE_STATUT[b.status]}</span>
                        {STATUT_BAGAGE[b.status] ?? b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateHeure(b.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {FLUX_STATUT[b.status] && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => avancerStatut(b.id, b.status)}
                          disabled={updateBaggage.isPending}
                        >
                          {LABEL_AVANCER[b.status]}
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal création */}
      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Luggage className="h-5 w-5" /> Enregistrer un bagage
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={soumettre} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Réservation *</Label>
                <Select
                  value={form.reservationId}
                  onValueChange={(v) => setForm((f) => ({ ...f, reservationId: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choisir une réservation" />
                  </SelectTrigger>
                  <SelectContent>
                    {reservations
                      ?.filter((r) => r.status !== "cancelled")
                      .map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          #{r.id} — {r.passengerName} · {r.originCity} → {r.destinationCity}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type de bagage *</Label>
                <Select value={form.type} onValueChange={changerType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_BAGAGE).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Poids (kg) *</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="0.1"
                  placeholder="10.5"
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                />
              </div>

              <div className="col-span-2">
                <Label>Frais de bagage (FCFA)</Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Tarif auto : {formatFCFA(TARIF_BAGAGE[form.type])}
                  </span>
                </div>
              </div>

              <div className="col-span-2">
                <Label>Notes</Label>
                <Input
                  className="mt-1"
                  placeholder="Fragile, contenu spécial…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            {/* Aperçu de la facturation */}
            {form.price && (
              <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Facturation automatique</div>
                <div className="font-bold text-lg">{formatFCFA(parseFloat(form.price) || 0)}</div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOuvert(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createBaggage.isPending}>
                {createBaggage.isPending ? "Enregistrement…" : "Enregistrer le bagage"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
