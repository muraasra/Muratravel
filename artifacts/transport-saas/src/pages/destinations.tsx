import { useListDestinations } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Destinations() {
  const { data: destinations, isLoading } = useListDestinations();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Destinations</h1>
        <Button>Add Destination</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Routes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
              ) : destinations?.map(dest => (
                <TableRow key={dest.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {dest.originCity} <ArrowRight className="h-4 w-4 text-muted-foreground" /> {dest.destinationCity}
                  </TableCell>
                  <TableCell>{dest.distanceKm ? `${dest.distanceKm} km` : '-'}</TableCell>
                  <TableCell>{dest.estimatedDurationMin ? `${dest.estimatedDurationMin} min` : '-'}</TableCell>
                  <TableCell>${dest.basePrice}</TableCell>
                  <TableCell>
                    <Badge variant={dest.status === "active" ? "default" : "secondary"}>
                      {dest.status}
                    </Badge>
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