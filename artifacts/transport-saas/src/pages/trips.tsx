import { useListTrips } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Trips() {
  const { data: trips, isLoading } = useListTrips();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "boarding": return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
      case "departed": return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20";
      case "arrived": return "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20";
      case "cancelled": return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      case "delayed": return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
      default: return "bg-slate-500/10 text-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Trips</h1>
        <Button>Schedule Trip</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Trips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Departure</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
              ) : trips?.map(trip => (
                <TableRow key={trip.id}>
                  <TableCell>
                    <div className="font-medium">{format(new Date(trip.departureDate), 'MMM d, yyyy')}</div>
                    <div className="text-xs text-muted-foreground">{trip.departureTime}</div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {trip.originCity} → {trip.destinationCity}
                  </TableCell>
                  <TableCell>{trip.vehicleLicensePlate}</TableCell>
                  <TableCell>
                    <span className={trip.seatsAvailable === 0 ? "text-red-500 font-medium" : ""}>
                      {trip.seatsAvailable}
                    </span> / {trip.seatsTotal}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(trip.status)}>
                      {trip.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/trips/${trip.id}`} className="text-primary hover:underline text-sm font-medium">
                      Details
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}