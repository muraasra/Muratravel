import { useState } from "react";
import { useListTrips, useListDestinations, useListVehicles, useListUsers, useCancelTrip, useCloseTrip } from "@workspace/api-client-react";
import { apiFetch } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatFCFA, formatDate, couleurStatutVoyage, STATUT_VOYAGE } from "@/lib/fcfa";
import { Plus, Eye, XCircle, CheckCircle } from "lucide-react";

export default function Voyages() {
  const { data: trips, isLoading } = useListTrips();
  const { data: destinations } = useListDestinations();
  const { data: vehicles } = useListVehicles();
  const { data: drivers } = useListUsers();
  const cancelTrip = useCancelTrip();
  const closeTrip = useCloseTrip();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [ouvert, setOuvert] = useState(false);
  const [saving, setSaving] = useState(false);
  const emptyForm = {
    destinationId: "", vehicleId: "", driverId: "", departureDate: "", departureTime: "",
    arrivalTime: "", price: "", offerType: "", capacity: "", notes: "",
    recurring: false, recurrenceEndDate: "",
  };
  const [form, setForm] = useState(emptyForm);

  const chauffeurs = drivers?.filter((u) => u.role === "driver") ?? [];

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    // Vehicle is optional; if no vehicle, a capacity is required to size the trip.
    if (!form.destinationId || !form.departureDate || !form.departureTime || !form.price) {
      toast({ title: "Champs requis manquants", description: "Destination, date, heure et tarif sont obligatoires.", variant: "destructive" });
      return;
    }
    if (!form.vehicleId && !form.capacity) {
      toast({ title: "Capacité requise", description: "Sans véhicule, indiquez le nombre de places.", variant: "destructive" });
      return;
    }
    if (form.recurring && !form.recurrenceEndDate) {
      toast({ title: "Fin de période requise", description: "Indiquez la date de fin pour un voyage récurrent.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch<{ created?: number }>("/api/trips", {
        method: "POST",
        body: JSON.stringify({
          destinationId: parseInt(form.destinationId),
          vehicleId: form.vehicleId ? parseInt(form.vehicleId) : null,
          driverId: form.driverId ? parseInt(form.driverId) : null,
          departureDate: form.departureDate,
          departureTime: form.departureTime,
          arrivalTime: form.arrivalTime || null,
          price: parseFloat(form.price),
          offerType: form.offerType || null,
          capacity: form.capacity ? parseInt(form.capacity) : null,
          notes: form.notes || null,
          recurring: form.recurring,
          recurrenceEndDate: form.recurring ? form.recurrenceEndDate : undefined,
        }),
      });
      qc.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({ title: res?.created && res.created > 1 ? `${res.created} départs programmés` : "Voyage programmé avec succès" });
      setOuvert(false);
      setForm(emptyForm);
    } catch (err) {
      toast({ title: "Erreur lors de la création", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function annuler(id: number) {
    await cancelTrip.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ["/api/trips"] });
    toast({ title: "Voyage annulé" });
  }

  async function clore(id: number) {
    await closeTrip.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ["/api/trips"] });
    toast({ title: "Voyage clôturé" });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Voyages</h1>
          <p className="text-muted-foreground text-sm mt-1">Planification et suivi des voyages</p>
        </div>
        <Button onClick={() => setOuvert(true)}>
          <Plus className="h-4 w-4 mr-2" /> Programmer un voyage
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tous les voyages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Départ</TableHead>
                <TableHead>Itinéraire</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Sièges</TableHead>
                <TableHead>Tarif</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : trips?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun voyage trouvé
                  </TableCell>
                </TableRow>
              ) : (
                trips?.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <div className="font-medium">{formatDate(trip.departureDate)}</div>
                      <div className="text-xs text-muted-foreground">{trip.departureTime}</div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {trip.originCity} → {trip.destinationCity}
                    </TableCell>
                    <TableCell className="text-sm">{trip.vehicleLicensePlate ?? <span className="text-muted-foreground italic">Sans bus</span>}</TableCell>
                    <TableCell>
                      <span className={trip.seatsAvailable === 0 ? "text-red-500 font-medium" : "text-emerald-600 font-medium"}>
                        {trip.seatsAvailable}
                      </span>
                      <span className="text-muted-foreground"> / {trip.seatsTotal}</span>
                    </TableCell>
                    <TableCell className="font-medium">{formatFCFA(trip.price)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={couleurStatutVoyage(trip.status)}>
                        {STATUT_VOYAGE[trip.status] ?? trip.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/trips/${trip.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Détails">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        {(trip.status === "scheduled" || trip.status === "boarding") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700"
                            title="Annuler"
                            onClick={() => annuler(trip.id)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {trip.status === "boarding" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-800"
                            title="Clôturer"
                            onClick={() => clore(trip.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Programmer un nouveau voyage</DialogTitle>
          </DialogHeader>
          <form onSubmit={soumettre} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Destination *</Label>
                <Select value={form.destinationId} onValueChange={(v) => setForm((f) => ({ ...f, destinationId: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner une route" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations?.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.originCity} → {d.destinationCity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Véhicule (optionnel)</Label>
                <Select value={form.vehicleId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, vehicleId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Aucun (sans bus)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun (sans bus)</SelectItem>
                    {vehicles?.filter((v) => v.status === "available" || v.status === "in_service").map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.licensePlate} — {v.brand} ({v.seatCount} places)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Places {form.vehicleId ? "(auto)" : "*"}</Label>
                <Input className="mt-1" type="number" placeholder={form.vehicleId ? "selon le véhicule" : "Ex. 50"} value={form.capacity} disabled={!!form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
              </div>

              <div>
                <Label>Type d'offre</Label>
                <Input className="mt-1" placeholder="Ex. VIP, Classique…" value={form.offerType} onChange={(e) => setForm((f) => ({ ...f, offerType: e.target.value }))} />
              </div>

              <div>
                <Label>Chauffeur</Label>
                <Select value={form.driverId} onValueChange={(v) => setForm((f) => ({ ...f, driverId: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Optionnel" />
                  </SelectTrigger>
                  <SelectContent>
                    {chauffeurs.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tarif (FCFA) *</Label>
                <Input className="mt-1" type="number" placeholder="5000" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>

              <div>
                <Label>Date de départ *</Label>
                <Input className="mt-1" type="date" value={form.departureDate} onChange={(e) => setForm((f) => ({ ...f, departureDate: e.target.value }))} />
              </div>

              <div>
                <Label>Heure de départ *</Label>
                <Input className="mt-1" type="time" value={form.departureTime} onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))} />
              </div>

              <div className="col-span-2">
                <Label>Heure d'arrivée estimée</Label>
                <Input className="mt-1" type="time" value={form.arrivalTime} onChange={(e) => setForm((f) => ({ ...f, arrivalTime: e.target.value }))} />
              </div>

              <div className="col-span-2 rounded-lg border p-3 bg-muted/20 space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={form.recurring} onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))} />
                  Voyage récurrent — un départ chaque jour sur une période
                </label>
                {form.recurring && (
                  <div>
                    <Label className="text-xs">Jusqu'au (inclus) *</Label>
                    <Input className="mt-1" type="date" min={form.departureDate || undefined} value={form.recurrenceEndDate} onChange={(e) => setForm((f) => ({ ...f, recurrenceEndDate: e.target.value }))} />
                    <p className="text-xs text-muted-foreground mt-1">Le système crée automatiquement le même départ à {form.departureTime || "l'heure indiquée"} chaque jour, du {form.departureDate || "…"} jusqu'à cette date.</p>
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <Label>Notes</Label>
                <Input className="mt-1" placeholder="Informations complémentaires…" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOuvert(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement…" : "Programmer le voyage"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
