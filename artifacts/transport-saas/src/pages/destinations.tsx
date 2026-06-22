import { useState } from "react";
import { useListDestinations, useCreateDestination } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatFCFA, formatDuree } from "@/lib/fcfa";
import { ArrowRight, Plus } from "lucide-react";

export default function Destinations() {
  const { data: destinations, isLoading } = useListDestinations();
  const createDestination = useCreateDestination();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({
    originCity: "",
    destinationCity: "",
    distanceKm: "",
    estimatedDurationMin: "",
    basePrice: "",
    companyId: "1",
  });

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!form.originCity || !form.destinationCity || !form.basePrice) {
      toast({ title: "Champs requis manquants", variant: "destructive" });
      return;
    }
    try {
      await createDestination.mutateAsync({
        data: {
          originCity: form.originCity,
          destinationCity: form.destinationCity,
          distanceKm: form.distanceKm ? parseFloat(form.distanceKm) : undefined,
          estimatedDurationMin: form.estimatedDurationMin ? parseInt(form.estimatedDurationMin) : undefined,
          basePrice: parseFloat(form.basePrice),
          companyId: parseInt(form.companyId),
          status: "active",
        },
      });
      qc.invalidateQueries({ queryKey: ["/api/destinations"] });
      toast({ title: "Destination ajoutée avec succès" });
      setOuvert(false);
      setForm({ originCity: "", destinationCity: "", distanceKm: "", estimatedDurationMin: "", basePrice: "", companyId: "1" });
    } catch {
      toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Destinations</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestion des itinéraires et tarifs</p>
        </div>
        <Button onClick={() => setOuvert(true)}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter une destination
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itinéraires enregistrés</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Itinéraire</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Durée estimée</TableHead>
                <TableHead>Tarif de base</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chargement…</TableCell></TableRow>
              ) : destinations?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune destination enregistrée</TableCell></TableRow>
              ) : (
                destinations?.map((dest) => (
                  <TableRow key={dest.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {dest.originCity}
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        {dest.destinationCity}
                      </div>
                    </TableCell>
                    <TableCell>{dest.distanceKm ? `${dest.distanceKm} km` : "—"}</TableCell>
                    <TableCell>{formatDuree(dest.estimatedDurationMin)}</TableCell>
                    <TableCell className="font-medium">{formatFCFA(dest.basePrice)}</TableCell>
                    <TableCell>
                      <Badge variant={dest.status === "active" ? "default" : "secondary"}>
                        {dest.status === "active" ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une destination</DialogTitle>
          </DialogHeader>
          <form onSubmit={soumettre} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ville de départ *</Label>
                <Input className="mt-1" placeholder="Dakar" value={form.originCity} onChange={(e) => setForm((f) => ({ ...f, originCity: e.target.value }))} />
              </div>
              <div>
                <Label>Ville d'arrivée *</Label>
                <Input className="mt-1" placeholder="Saint-Louis" value={form.destinationCity} onChange={(e) => setForm((f) => ({ ...f, destinationCity: e.target.value }))} />
              </div>
              <div>
                <Label>Distance (km)</Label>
                <Input className="mt-1" type="number" placeholder="270" value={form.distanceKm} onChange={(e) => setForm((f) => ({ ...f, distanceKm: e.target.value }))} />
              </div>
              <div>
                <Label>Durée estimée (min)</Label>
                <Input className="mt-1" type="number" placeholder="210" value={form.estimatedDurationMin} onChange={(e) => setForm((f) => ({ ...f, estimatedDurationMin: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Tarif de base (FCFA) *</Label>
                <Input className="mt-1" type="number" placeholder="5000" value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOuvert(false)}>Annuler</Button>
              <Button type="submit" disabled={createDestination.isPending}>
                {createDestination.isPending ? "Enregistrement…" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
