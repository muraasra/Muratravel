import { useListReservations } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Reservations() {
  const { data: reservations, isLoading } = useListReservations();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
        <Button>New Reservation</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reservations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Passenger</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
              ) : reservations?.map(res => (
                <TableRow key={res.id}>
                  <TableCell>#{res.id}</TableCell>
                  <TableCell className="font-medium">{res.passengerName}</TableCell>
                  <TableCell>{res.originCity} → {res.destinationCity}</TableCell>
                  <TableCell>{res.seatNumber || "-"}</TableCell>
                  <TableCell>${res.price}</TableCell>
                  <TableCell>
                    <Badge variant={res.status === "paid" || res.status === "boarded" ? "default" : "secondary"}>
                      {res.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/reservations/${res.id}`} className="text-primary hover:underline text-sm font-medium">
                      Ticket
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