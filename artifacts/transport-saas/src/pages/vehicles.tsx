import { useState } from "react";
import { useListVehicles, useCreateVehicle } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { couleurStatutVehicule, STATUT_VEHICULE, TYPE_VEHICULE } from "@/lib/fcfa";
import { Bus, Users, Plus, Calendar } from "lucide-react";

export default function Vehicules() {
  const { data: vehicles, isLoading } = useListVehicles();
  const createVehicle = useCreateVehicle();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({
    licensePlate: "",
    type: "bus",
    brand: "",
    model: "",
    year: new Date().getFullYear().toString(),
    seatCount: "",
    insuranceExpiry: "",
    companyId: "1",
    status: "available",
  });

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!form.licensePlate || !form.brand || !form.model || !form.seatCount) {
      toast({ title: "Champs requis manquants", variant: "destructive" });
      return;
    }
    try {
      await createVehicle.mutateAsync({
        data: {
          licensePlate: form.licensePlate,
          type: form.type as "bus" | "minibus" | "van" | "ferry" | "train",
          brand: form.brand,
          model: form.model,
          year: parseInt(form.year),
          seatCount: parseInt(form.seatCount),
          insuranceExpiry: form.insuranceExpiry || undefined,
          companyId: parseInt(form.companyId),
          status: form.status as "available" | "in_service" | "maintenance" | "retired",
        },
      });
      qc.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Véhicule ajouté avec succès" });
      setOuvert(false);
      setForm({ licensePlate: "", type: "bus", brand: "", model: "", year: new Date().getFullYear().toString(), seatCount: "", insuranceExpiry: "", companyId: "1", status: "available" });
    } catch {
      toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
    }
  }

  const disponibles = vehicles?.filter((v) => v.status === "available").length ?? 0;
  const enService = vehicles?.filter((v) => v.status === "in_service").length ?? 0;
  const maintenance = vehicles?.filter((v) => v.status === "maintenance").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Flotte</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestion du parc de véhicules</p>
        </div>
        <Button onClick={() => setOuvert(true)}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter un véhicule
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Disponibles</p>
            <p className="text-3xl font-bold text-emerald-600">{disponibles}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">En service</p>
            <p className="text-3xl font-bold text-blue-600">{enService}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">En maintenance</p>
            <p className="text-3xl font-bold text-amber-600">{maintenance}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))
        ) : vehicles?.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">Aucun véhicule enregistré</div>
        ) : (
          vehicles?.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold font-mono">{vehicle.licensePlate}</CardTitle>
                    <p className="text-sm text-muted-foreground">{vehicle.brand} {vehicle.model} · {vehicle.year}</p>
                  </div>
                  <Badge variant="outline" className={couleurStatutVehicule(vehicle.status)}>
                    {STATUT_VEHICULE[vehicle.status] ?? vehicle.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Bus className="mr-2 h-4 w-4" />
                  <span className="capitalize">{TYPE_VEHICULE[vehicle.type] ?? vehicle.type}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  <span>{vehicle.seatCount} places</span>
                </div>
                {vehicle.insuranceExpiry && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Assurance : {new Intl.DateTimeFormat("fr-FR").format(new Date(vehicle.insuranceExpiry))}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un véhicule</DialogTitle>
          </DialogHeader>
          <form onSubmit={soumettre} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Plaque d'immatriculation *</Label>
                <Input className="mt-1" placeholder="DK-0000-AB" value={form.licensePlate} onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))} />
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_VEHICULE).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUT_VEHICULE).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Marque *</Label>
                <Input className="mt-1" placeholder="Mercedes" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
              </div>
              <div>
                <Label>Modèle *</Label>
                <Input className="mt-1" placeholder="Sprinter 516" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} />
              </div>
              <div>
                <Label>Année</Label>
                <Input className="mt-1" type="number" placeholder="2023" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
              </div>
              <div>
                <Label>Nombre de sièges *</Label>
                <Input className="mt-1" type="number" placeholder="50" value={form.seatCount} onChange={(e) => setForm((f) => ({ ...f, seatCount: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Expiration assurance</Label>
                <Input className="mt-1" type="date" value={form.insuranceExpiry} onChange={(e) => setForm((f) => ({ ...f, insuranceExpiry: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOuvert(false)}>Annuler</Button>
              <Button type="submit" disabled={createVehicle.isPending}>
                {createVehicle.isPending ? "Enregistrement…" : "Ajouter le véhicule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
