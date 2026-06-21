import { useListVehicles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bus, Users } from "lucide-react";

export default function Vehicles() {
  const { data: vehicles, isLoading } = useListVehicles();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20";
      case "in_service": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "maintenance": return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
      case "retired": return "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20";
      default: return "bg-slate-500/10 text-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Fleet Management</h1>
        <Button>Add Vehicle</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div>Loading...</div>
        ) : vehicles?.map(vehicle => (
          <Card key={vehicle.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-bold">{vehicle.licensePlate}</CardTitle>
                <Badge variant="outline" className={getStatusColor(vehicle.status)}>{vehicle.status.replace('_', ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Bus className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{vehicle.type}</span>
                  <span className="mx-2 text-muted-foreground">•</span>
                  <span>{vehicle.brand} {vehicle.model}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{vehicle.seatCount} seats</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}