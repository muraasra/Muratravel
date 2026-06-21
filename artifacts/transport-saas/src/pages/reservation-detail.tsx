import { useGetReservation, useBoardPassenger } from "@workspace/api-client-react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatFCFA, formatDate, couleurStatutReservation, STATUT_RESERVATION } from "@/lib/fcfa";
import { Ticket, User, MapPin, Calendar, CreditCard, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function DetailReservation() {
  const [, params] = useRoute("/reservations/:id");
  const [, navigate] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: reservation, isLoading } = useGetReservation(id, { query: { enabled: !!id } });
  const boardPassenger = useBoardPassenger();
  const qc = useQueryClient();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-80 bg-muted rounded-lg" />
      </div>
    );
  }
  if (!reservation) return <div className="text-muted-foreground">Réservation introuvable.</div>;

  async function embarquer() {
    await boardPassenger.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: [`/api/reservations/${id}`] });
    qc.invalidateQueries({ queryKey: ["/api/reservations"] });
    toast({ title: "Passager embarqué avec succès" });
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reservations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billet #{reservation.id}</h1>
            <p className="text-sm text-muted-foreground font-mono">{reservation.ticketCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={couleurStatutReservation(reservation.status)}>
            {STATUT_RESERVATION[reservation.status] ?? reservation.status}
          </Badge>
          {reservation.status !== "boarded" && reservation.status !== "cancelled" && (
            <Button size="sm" className="gap-1" onClick={embarquer} disabled={boardPassenger.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              {boardPassenger.isPending ? "…" : "Embarquer"}
            </Button>
          )}
        </div>
      </div>

      <Card className="border-2 border-primary/20 overflow-hidden">
        <div className="bg-primary/10 px-6 py-4 flex justify-between items-center border-b border-primary/10">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Ticket className="h-5 w-5" />
            E-Billet TransportHub
          </div>
          <div className="text-sm font-mono bg-white px-3 py-1.5 rounded border shadow-sm tracking-widest">
            {reservation.ticketCode || `TKT-${String(reservation.id).padStart(6, "0")}`}
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center mb-1">
                  <User className="w-3.5 h-3.5 mr-1" /> Passager
                </div>
                <div className="font-semibold text-lg">{reservation.passengerName}</div>
                <div className="text-sm text-muted-foreground">{reservation.passengerPhone}</div>
                {reservation.passengerEmail && (
                  <div className="text-sm text-muted-foreground">{reservation.passengerEmail}</div>
                )}
              </div>

              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center mb-1">
                  <MapPin className="w-3.5 h-3.5 mr-1" /> Itinéraire
                </div>
                <div className="font-semibold text-base">{reservation.originCity} → {reservation.destinationCity}</div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center mb-1">
                  <Calendar className="w-3.5 h-3.5 mr-1" /> Date de départ
                </div>
                <div className="font-semibold">{formatDate(reservation.departureDate)}</div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Siège</div>
                  <div className="font-bold text-3xl font-mono">{reservation.seatNumber || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center justify-end mb-1">
                    <CreditCard className="w-3.5 h-3.5 mr-1" /> Tarif
                  </div>
                  <div className="font-bold text-xl">{formatFCFA(reservation.price)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-dashed">
            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                Réservation créée le {reservation.createdAt ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(reservation.createdAt)) : "—"}
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-secondary rounded flex items-center justify-center border-2 border-border">
                  <div className="grid grid-cols-3 gap-0.5 opacity-60">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className={`w-6 h-6 rounded-sm ${Math.random() > 0.4 ? "bg-foreground" : "bg-transparent"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">QR Code</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
