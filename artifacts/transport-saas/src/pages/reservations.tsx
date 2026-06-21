import { useState } from "react";
import { useListReservations, useCreateReservation, useListTrips } from "@workspace/api-client-react";
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
import { formatFCFA, formatDate, couleurStatutReservation, STATUT_RESERVATION } from "@/lib/fcfa";
import { Plus, Eye } from "lucide-react";

export default function Reservations() {
  const { data: reservations, isLoading } = useListReservations();
  const { data: trips } = useListTrips();
  const createReservation = useCreateReservation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({
    tripId: "",
    passengerName: "",
    passengerPhone: "",
    passengerEmail: "",
    seatNumber: "",
    price: "",
  });

  const voyagesActifs = trips?.filter((t) => t.status === "scheduled" || t.status === "boarding") ?? [];

  function selectionnerVoyage(tripId: string) {
    const trip = voyagesActifs.find((t) => String(t.id) === tripId);
    setForm((f) => ({ ...f, tripId, price: trip ? String(trip.price) : f.price }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!form.tripId || !form.passengerName || !form.passengerPhone || !form.price) {
      toast({ title: "Champs requis manquants", variant: "destructive" });
      return;
    }
    try {
      await createReservation.mutateAsync({
        data: {
          tripId: parseInt(form.tripId),
          passengerName: form.passengerName,
          passengerPhone: form.passengerPhone,
          passengerEmail: form.passengerEmail || undefined,
          seatNumber: form.seatNumber || undefined,
          price: parseFloat(form.price),
          status: "reserved",
          companyId: 1,
        },
      });
      qc.invalidateQueries({ queryKey: ["/api/reservations"] });
      qc.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({ title: "Réservation créée avec succès" });
      setOuvert(false);
      setForm({ tripId: "", passengerName: "", passengerPhone: "", passengerEmail: "", seatNumber: "", price: "" });
    } catch {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Réservations</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestion des réservations et billets</p>
        </div>
        <Button onClick={() => setOuvert(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nouvelle réservation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les réservations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Billet</TableHead>
                <TableHead>Passager</TableHead>
                <TableHead>Itinéraire</TableHead>
                <TableHead>Départ</TableHead>
                <TableHead>Siège</TableHead>
                <TableHead>Tarif</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Chargement…</TableCell>
                </TableRow>
              ) : reservations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucune réservation</TableCell>
                </TableRow>
              ) : (
                reservations?.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-mono text-xs">{res.ticketCode || `#${res.id}`}</TableCell>
                    <TableCell>
                      <div className="font-medium">{res.passengerName}</div>
                      <div className="text-xs text-muted-foreground">{res.passengerPhone}</div>
                    </TableCell>
                    <TableCell>{res.originCity} → {res.destinationCity}</TableCell>
                    <TableCell className="text-sm">{formatDate(res.departureDate)}</TableCell>
                    <TableCell className="font-mono">{res.seatNumber || "—"}</TableCell>
                    <TableCell className="font-medium">{formatFCFA(res.price)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={couleurStatutReservation(res.status)}>
                        {STATUT_RESERVATION[res.status] ?? res.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/reservations/${res.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Voir le billet">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
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
            <DialogTitle>Nouvelle réservation</DialogTitle>
          </DialogHeader>
          <form onSubmit={soumettre} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Voyage *</Label>
                <Select value={form.tripId} onValueChange={selectionnerVoyage}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un voyage" />
                  </SelectTrigger>
                  <SelectContent>
                    {voyagesActifs.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.originCity} → {t.destinationCity} · {formatDate(t.departureDate)} {t.departureTime} ({t.seatsAvailable} places)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>Nom du passager *</Label>
                <Input className="mt-1" placeholder="Prénom et Nom" value={form.passengerName} onChange={(e) => setForm((f) => ({ ...f, passengerName: e.target.value }))} />
              </div>

              <div>
                <Label>Téléphone *</Label>
                <Input className="mt-1" placeholder="+221 77 …" value={form.passengerPhone} onChange={(e) => setForm((f) => ({ ...f, passengerPhone: e.target.value }))} />
              </div>

              <div>
                <Label>Email</Label>
                <Input className="mt-1" type="email" placeholder="optionnel" value={form.passengerEmail} onChange={(e) => setForm((f) => ({ ...f, passengerEmail: e.target.value }))} />
              </div>

              <div>
                <Label>Numéro de siège</Label>
                <Input className="mt-1" placeholder="ex : A1" value={form.seatNumber} onChange={(e) => setForm((f) => ({ ...f, seatNumber: e.target.value }))} />
              </div>

              <div>
                <Label>Tarif (FCFA) *</Label>
                <Input className="mt-1" type="number" placeholder="5000" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOuvert(false)}>Annuler</Button>
              <Button type="submit" disabled={createReservation.isPending}>
                {createReservation.isPending ? "Enregistrement…" : "Créer la réservation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
