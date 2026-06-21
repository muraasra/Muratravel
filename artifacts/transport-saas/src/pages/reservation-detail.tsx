import { useGetReservation } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, User, MapPin, Calendar, CreditCard } from "lucide-react";

export default function ReservationDetail() {
  const [, params] = useRoute("/reservations/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: reservation, isLoading } = useGetReservation(id, { query: { enabled: !!id } });

  if (isLoading) return <div>Loading...</div>;
  if (!reservation) return <div>Reservation not found</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Reservation #{reservation.id}</h1>
        <Badge variant={reservation.status === "paid" || reservation.status === "boarded" ? "default" : "secondary"}>
          {reservation.status}
        </Badge>
      </div>

      <Card className="border-2 border-primary/20 overflow-hidden">
        <div className="bg-primary/10 px-6 py-4 flex justify-between items-center border-b border-primary/10">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Ticket className="h-5 w-5" />
            E-Ticket
          </div>
          <div className="text-sm font-mono bg-white px-2 py-1 rounded border shadow-sm">
            {reservation.ticketCode || `TKT-${reservation.id.toString().padStart(6, '0')}`}
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="text-sm text-muted-foreground flex items-center mb-1"><User className="w-4 h-4 mr-1"/> Passenger</div>
                <div className="font-semibold text-lg">{reservation.passengerName}</div>
                <div className="text-sm text-muted-foreground">{reservation.passengerPhone}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground flex items-center mb-1"><MapPin className="w-4 h-4 mr-1"/> Route</div>
                <div className="font-semibold">{reservation.originCity} → {reservation.destinationCity}</div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="text-sm text-muted-foreground flex items-center mb-1"><Calendar className="w-4 h-4 mr-1"/> Departure</div>
                <div className="font-semibold">{reservation.departureDate ? new Date(reservation.departureDate).toLocaleDateString() : 'N/A'}</div>
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-sm text-muted-foreground">Seat</div>
                  <div className="font-bold text-2xl">{reservation.seatNumber || 'Any'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground flex items-center justify-end mb-1"><CreditCard className="w-4 h-4 mr-1"/> Price</div>
                  <div className="font-bold text-xl">${reservation.price}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-dashed flex justify-center">
            {/* Mock QR Code */}
            <div className="w-32 h-32 bg-secondary rounded flex items-center justify-center border-2 border-border">
              <div className="text-center text-xs text-muted-foreground">Scan<br/>QR Code</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}