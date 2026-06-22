import { useState } from "react";
import { useListAgencies, useCreateAgency, useListCompanies } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin } from "lucide-react";

export default function Agences() {
  const { data: agencies, isLoading } = useListAgencies();
  const { data: companies } = useListCompanies();
  const createAgency = useCreateAgency();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    country: "SN",
    address: "",
    companyId: "",
    phone: "",
    email: "",
  });

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.city || !form.companyId) {
      toast({ title: "Champs requis manquants", variant: "destructive" });
      return;
    }
    try {
      await createAgency.mutateAsync({
        data: {
          name: form.name,
          city: form.city,
          country: form.country,
          address: form.address || undefined,
          companyId: parseInt(form.companyId),
          phone: form.phone || undefined,
          email: form.email || undefined,
          status: "active",
        },
      });
      qc.invalidateQueries({ queryKey: ["/api/agencies"] });
      toast({ title: "Agence créée avec succès" });
      setOuvert(false);
      setForm({ name: "", city: "", country: "SN", address: "", companyId: "", phone: "", email: "" });
    } catch {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agences</h1>
          <p className="text-muted-foreground text-sm mt-1">Points de vente et agences locales</p>
        </div>
        <Button onClick={() => setOuvert(true)}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter une agence
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les agences</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Responsable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement…</TableCell></TableRow>
              ) : agencies?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune agence</TableCell></TableRow>
              ) : (
                agencies?.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {agency.name}
                      </div>
                      {agency.address && <div className="text-xs text-muted-foreground ml-5">{agency.address}</div>}
                    </TableCell>
                    <TableCell>{agency.city}</TableCell>
                    <TableCell>{agency.country}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{agency.phone || agency.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={agency.status === "active" ? "default" : "secondary"}>
                        {agency.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{agency.managerName || "Non assigné"}</TableCell>
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
            <DialogTitle>Ajouter une agence</DialogTitle>
          </DialogHeader>
          <form onSubmit={soumettre} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nom de l'agence *</Label>
                <Input className="mt-1" placeholder="Agence Dakar Centre" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Compagnie *</Label>
                <Select value={form.companyId} onValueChange={(v) => setForm((f) => ({ ...f, companyId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner une compagnie" /></SelectTrigger>
                  <SelectContent>
                    {companies?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ville *</Label>
                <Input className="mt-1" placeholder="Dakar" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <Label>Pays</Label>
                <Input className="mt-1" placeholder="SN" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Adresse</Label>
                <Input className="mt-1" placeholder="Rue, Quartier" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input className="mt-1" placeholder="+221…" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1" type="email" placeholder="agence@…" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOuvert(false)}>Annuler</Button>
              <Button type="submit" disabled={createAgency.isPending}>
                {createAgency.isPending ? "Enregistrement…" : "Créer l'agence"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
