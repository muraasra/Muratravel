import { useGetTripManifest, useGetTrip, useCancelTrip, useCloseTrip } from "@workspace/api-client-react";
import { useRoute, useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatFCFA, formatDate, couleurStatutVoyage, couleurStatutReservation, STATUT_VOYAGE, STATUT_RESERVATION } from "@/lib/fcfa";
import { ArrowLeft, XCircle, CheckCircle, Users, Bus, Calendar, Clock } from "lucide-react";

export default function DetailVoyage() {
  const [, params] = useRoute("/trips/:id");
  const [, navigate] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: trip, isLoading: tripLoading } = useGetTrip(id, { query: { enabled: !!id } });
  const { data: manifest, isLoading: manifestLoading } = useGetTripManifest(id, { query: { enabled: !!id } });
  const cancelTrip = useCancelTrip();
  const closeTrip = useCloseTrip();
  const qc = useQueryClient();
  const { toast } = useToast();

  if (tripLoading || manifestLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-40 bg-muted rounded-lg" />
      </div>
    );
  }
  if (!trip) return <div className="text-muted-foreground">Voyage introuvable.</div>;

  const nbEmbarques = manifest?.passengers?.filter((p) => p.status === "boarded").length ?? 0;
  const nbTotal = manifest?.passengers?.length ?? 0;

  async function annuler() {
    await cancelTrip.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ["/api/trips"] });
    qc.invalidateQueries({ queryKey: [`/api/trips/${id}`] });
    toast({ title: "Voyage annulé" });
  }

  async function clore() {
    await closeTrip.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ["/api/trips"] });
    qc.invalidateQueries({ queryKey: [`/api/trips/${id}`] });
    toast({ title: "Voyage clôturé — arrivé à destination" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/trips")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {trip.originCity} → {trip.destinationCity}
            </h1>
            <p className="text-muted-foreground text-sm">Voyage #{trip.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={couleurStatutVoyage(trip.status)}>
            {STATUT_VOYAGE[trip.status] ?? trip.status}
          </Badge>
          {(trip.status === "scheduled" || trip.status === "boarding") && (
            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={annuler}>
              <XCircle className="h-4 w-4 mr-1" /> Annuler
            </Button>
          )}
          {trip.status === "boarding" && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={clore}>
              <CheckCircle className="h-4 w-4 mr-1" /> Clôturer
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="h-4 w-4" /> Date de départ
            </div>
            <p className="font-semibold">{formatDate(trip.departureDate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="h-4 w-4" /> Horaires
            </div>
            <p className="font-semibold">{trip.departureTime}{trip.arrivalTime ? ` → ${trip.arrivalTime}` : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Bus className="h-4 w-4" /> Véhicule
            </div>
            <p className="font-semibold">{trip.vehicleLicensePlate || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="h-4 w-4" /> Sièges
            </div>
            <p className="font-semibold">
              <span className="text-emerald-600">{nbEmbarques} embarqués</span>
              {" / "}{nbTotal} réservés / {trip.seatsTotal} total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Manifeste des passagers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Passager</TableHead>
                  <TableHead>Siège</TableHead>
                  <TableHead>Bagages</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manifest?.passengers?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun passager enregistré</TableCell></TableRow>
                ) : (
                  manifest?.passengers?.map((p, i) => (
                    <TableRow key={i} className={p.status === "boarded" ? "bg-emerald-50/50" : ""}>
                      <TableCell className="font-medium">{p.passengerName}</TableCell>
                      <TableCell className="font-mono">{p.seatNumber || "—"}</TableCell>
                      <TableCell>{p.baggageCount || 0}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={couleurStatutReservation(p.status)}>
                          {STATUT_RESERVATION[p.status] ?? p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Résumé financier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Tarif par passager</p>
              <p className="text-xl font-bold">{formatFCFA(trip.price)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenus estimés</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatFCFA(trip.price * nbTotal)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taux de remplissage</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${trip.seatsTotal > 0 ? ((trip.seatsTotal - trip.seatsAvailable) / trip.seatsTotal) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {trip.seatsTotal > 0 ? Math.round(((trip.seatsTotal - trip.seatsAvailable) / trip.seatsTotal) * 100) : 0}%
                </span>
              </div>
            </div>
            {trip.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm mt-1">{trip.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
