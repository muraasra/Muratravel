import { useState } from "react";
import { useListTrips, useGetTripManifest, useBoardPassenger } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDate, couleurStatutReservation, STATUT_RESERVATION } from "@/lib/fcfa";
import { ScanLine, Users, CheckCircle2, Clock, UserCheck } from "lucide-react";

export default function Embarquement() {
  const { data: trips, isLoading: tripsLoading } = useListTrips();
  const [tripIdSelectionne, setTripIdSelectionne] = useState<number | null>(null);
  const { data: manifest, isLoading: manifestLoading } = useGetTripManifest(
    tripIdSelectionne ?? 0,
    { query: { enabled: !!tripIdSelectionne, queryKey: [`/api/trips/${tripIdSelectionne}/manifest`] } }
  );
  const boardPassenger = useBoardPassenger();
  const qc = useQueryClient();
  const { toast } = useToast();

  const voyagesEnEmbarquement = trips?.filter(
    (t) => t.status === "boarding" || t.status === "scheduled"
  ) ?? [];

  const tripSelectionne = trips?.find((t) => t.id === tripIdSelectionne);

  const nbEmbarques = manifest?.passengers?.filter((p) => p.status === "boarded").length ?? 0;
  const nbTotal = manifest?.passengers?.length ?? 0;
  const pourcentage = nbTotal > 0 ? Math.round((nbEmbarques / nbTotal) * 100) : 0;

  async function embarquerPassager(reservationId: number, nom: string) {
    try {
      await boardPassenger.mutateAsync({ id: reservationId });
      qc.invalidateQueries({ queryKey: [`/api/trips/${tripIdSelectionne}/manifest`] });
      qc.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({ title: `✓ ${nom} embarqué(e)` });
    } catch {
      toast({ title: "Erreur lors de l'embarquement", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ScanLine className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Embarquement</h1>
          <p className="text-muted-foreground text-sm">Gestion de l'embarquement des passagers</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un voyage</CardTitle>
        </CardHeader>
        <CardContent>
          {tripsLoading ? (
            <div className="text-muted-foreground text-sm">Chargement des voyages…</div>
          ) : voyagesEnEmbarquement.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              Aucun voyage en cours d'embarquement aujourd'hui.
            </div>
          ) : (
            <Select
              value={tripIdSelectionne ? String(tripIdSelectionne) : ""}
              onValueChange={(v) => setTripIdSelectionne(parseInt(v))}
            >
              <SelectTrigger className="max-w-lg">
                <SelectValue placeholder="Choisir un voyage pour démarrer l'embarquement" />
              </SelectTrigger>
              <SelectContent>
                {voyagesEnEmbarquement.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.originCity} → {t.destinationCity} · {formatDate(t.departureDate)} {t.departureTime} · {t.seatsTotal - (t.seatsAvailable ?? 0)} passager(s)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {tripIdSelectionne && tripSelectionne && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Embarqués</p>
                    <p className="text-3xl font-bold text-emerald-600">{nbEmbarques}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-emerald-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <p className="text-3xl font-bold text-amber-600">{nbTotal - nbEmbarques}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total réservations</p>
                    <p className="text-3xl font-bold">{nbTotal}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Progression</p>
                    <span className="text-sm font-bold">{pourcentage}%</span>
                  </div>
                  <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pourcentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Manifeste — {tripSelectionne.originCity} → {tripSelectionne.destinationCity}
              </CardTitle>
              <Badge variant="outline">
                Véh. {manifest?.vehicleLicensePlate} · {manifest?.totalSeats} places
              </Badge>
            </CardHeader>
            <CardContent>
              {manifestLoading ? (
                <div className="text-muted-foreground text-sm py-4">Chargement du manifeste…</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Passager</TableHead>
                      <TableHead>Siège</TableHead>
                      <TableHead>Bagages</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manifest?.passengers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Aucun passager enregistré pour ce voyage
                        </TableCell>
                      </TableRow>
                    ) : (
                      manifest?.passengers?.map((p, i) => (
                        <TableRow key={i} className={p.status === "boarded" ? "bg-emerald-50/50" : ""}>
                          <TableCell className="font-medium">{p.passengerName}</TableCell>
                          <TableCell className="font-mono">{p.seatNumber || "—"}</TableCell>
                          <TableCell>{p.baggageCount || 0} bagage(s)</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={couleurStatutReservation(p.status)}>
                              {STATUT_RESERVATION[p.status] ?? p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {p.status !== "boarded" && p.status !== "cancelled" ? (
                              <Button
                                size="sm"
                                className="h-7 gap-1"
                                onClick={() => embarquerPassager(p.reservationId, p.passengerName)}
                                disabled={boardPassenger.isPending}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Embarquer
                              </Button>
                            ) : p.status === "boarded" ? (
                              <span className="text-emerald-600 text-sm font-medium flex items-center gap-1 justify-end">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Embarqué
                              </span>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
