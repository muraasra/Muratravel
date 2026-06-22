import { useState } from "react";
import { useListCompanies, useCreateCompany } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Eye } from "lucide-react";

const PAYS = [
  { code: "SN", nom: "Sénégal" },
  { code: "CI", nom: "Côte d'Ivoire" },
  { code: "ML", nom: "Mali" },
  { code: "BF", nom: "Burkina Faso" },
  { code: "GN", nom: "Guinée" },
  { code: "CM", nom: "Cameroun" },
  { code: "MA", nom: "Maroc" },
  { code: "TN", nom: "Tunisie" },
  { code: "DZ", nom: "Algérie" },
];

const DEVISES = [
  { code: "XOF", nom: "Franc CFA (UEMOA) — XOF" },
  { code: "XAF", nom: "Franc CFA (CEMAC) — XAF" },
  { code: "MAD", nom: "Dirham marocain — MAD" },
  { code: "TND", nom: "Dinar tunisien — TND" },
  { code: "DZD", nom: "Dinar algérien — DZD" },
];

export default function Compagnies() {
  const { data: companies, isLoading } = useListCompanies();
  const createCompany = useCreateCompany();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: "SN",
    currency: "XOF",
    email: "",
    phone: "",
    address: "",
  });

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      toast({ title: "Le nom de la compagnie est requis", variant: "destructive" });
      return;
    }
    try {
      await createCompany.mutateAsync({
        data: {
          name: form.name,
          country: form.country,
          currency: form.currency,
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          status: "active",
          language: "fr",
        },
      });
      qc.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Compagnie créée avec succès" });
      setOuvert(false);
      setForm({ name: "", country: "SN", currency: "XOF", email: "", phone: "", address: "" });
    } catch {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    }
  }

  const actives = companies?.filter((c) => c.status === "active").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compagnies</h1>
          <p className="text-muted-foreground text-sm mt-1">{actives} compagnie(s) active(s)</p>
        </div>
        <Button onClick={() => setOuvert(true)}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter une compagnie
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les compagnies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Devise</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement…</TableCell></TableRow>
              ) : companies?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune compagnie</TableCell></TableRow>
              ) : (
                companies?.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.country}</TableCell>
                    <TableCell className="font-mono text-sm">{company.currency}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{company.email || company.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={company.status === "active" ? "default" : "secondary"}>
                        {company.status === "active" ? "Actif" : company.status === "inactive" ? "Inactif" : company.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/companies/${company.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
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
            <DialogTitle>Ajouter une compagnie</DialogTitle>
          </DialogHeader>
          <form onSubmit={soumettre} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nom de la compagnie *</Label>
                <Input className="mt-1" placeholder="TransAfrique Express" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Pays</Label>
                <Select value={form.country} onValueChange={(v) => setForm((f) => ({ ...f, country: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYS.map((p) => <SelectItem key={p.code} value={p.code}>{p.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Devise</Label>
                <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEVISES.map((d) => <SelectItem key={d.code} value={d.code}>{d.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1" type="email" placeholder="contact@…" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input className="mt-1" placeholder="+221 77…" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Adresse</Label>
                <Input className="mt-1" placeholder="Rue, Ville" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOuvert(false)}>Annuler</Button>
              <Button type="submit" disabled={createCompany.isPending}>
                {createCompany.isPending ? "Enregistrement…" : "Créer la compagnie"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
