import { useGetTripManifest, useGetTrip } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TripDetail() {
  const [, params] = useRoute("/trips/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: trip, isLoading: tripLoading } = useGetTrip(id, { query: { enabled: !!id } });
  const { data: manifest, isLoading: manifestLoading } = useGetTripManifest(id, { query: { enabled: !!id } });

  if (tripLoading || manifestLoading) return <div>Loading...</div>;
  if (!trip) return <div>Trip not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trip #{trip.id}</h1>
          <p className="text-muted-foreground">{trip.originCity} → {trip.destinationCity}</p>
        </div>
        <Badge variant="outline">{trip.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Passenger Manifest</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Passenger Name</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead>Baggage</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manifest?.passengers?.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{p.passengerName}</TableCell>
                  <TableCell>{p.seatNumber || "-"}</TableCell>
                  <TableCell>{p.baggageCount || 0}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "boarded" ? "default" : "secondary"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!manifest?.passengers?.length && (
                <TableRow><TableCell colSpan={4} className="text-center py-4">No passengers booked</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}