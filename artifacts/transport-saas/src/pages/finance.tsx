import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatFCFA, formatDateHeure, METHODE_PAIEMENT } from "@/lib/fcfa";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Banknote,
  CreditCard,
  Smartphone,
  Building,
} from "lucide-react";

type TypeTransaction = "encaissement" | "depense" | "remboursement";
type MethodePaiement = "cash" | "card" | "mobile_money" | "bank_transfer";

interface Transaction {
  id: number;
  type: TypeTransaction;
  montant: number;
  description: string;
  methode: MethodePaiement;
  reference: string;
  createdAt: string;
}

interface FinanceSummary {
  encaissements: number;
  depenses: number;
  remboursements: number;
  solde: number;
}

const ICONE_METHODE: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-3.5 w-3.5" />,
  card: <CreditCard className="h-3.5 w-3.5" />,
  mobile_money: <Smartphone className="h-3.5 w-3.5" />,
  bank_transfer: <Building className="h-3.5 w-3.5" />,
};

const COULEUR_TYPE: Record<TypeTransaction, string> = {
  encaissement: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  depense: "bg-red-500/10 text-red-600 border-red-200",
  remboursement: "bg-amber-500/10 text-amber-600 border-amber-200",
};

const LABEL_TYPE: Record<TypeTransaction, string> = {
  encaissement: "Encaissement",
  depense: "Dépense",
  remboursement: "Remboursement",
};

export default function Finance() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [onglet, setOnglet] = useState("tout");
  const [form, setForm] = useState({
    type: "encaissement" as TypeTransaction,
    montant: "",
    description: "",
    methode: "cash" as MethodePaiement,
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/finance/transactions"],
    queryFn: () => apiFetch<Transaction[]>("/api/finance/transactions"),
  });
  const { data: summary } = useQuery({
    queryKey: ["/api/finance/summary"],
    queryFn: () => apiFetch<FinanceSummary>("/api/finance/summary"),
  });

  const total_encaissements = summary?.encaissements ?? 0;
  const total_depenses = summary?.depenses ?? 0;
  const total_remboursements = summary?.remboursements ?? 0;
  const solde = summary?.solde ?? 0;

  const filtre = onglet === "tout" ? transactions : transactions.filter(t => t.type === onglet as TypeTransaction);

  const createTransaction = useMutation({
    mutationFn: (body: { type: TypeTransaction; montant: number; description: string; methode: MethodePaiement }) =>
      apiFetch<Transaction>("/api/finance/transactions", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/finance/transactions"] });
      qc.invalidateQueries({ queryKey: ["/api/finance/summary"] });
      toast({ title: "Transaction enregistrée" });
      setOuvert(false);
      setForm({ type: "encaissement", montant: "", description: "", methode: "cash" });
    },
    onError: (err: Error) => toast({ title: "Erreur lors de l'enregistrement", description: err.message, variant: "destructive" }),
  });

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!form.montant || !form.description) {
      toast({ title: "Champs requis manquants", variant: "destructive" });
      return;
    }
    createTransaction.mutate({
      type: form.type,
      montant: parseFloat(form.montant),
      description: form.description,
      methode: form.methode,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal de caisse</h1>
          <p className="text-muted-foreground text-sm mt-1">Encaissements, dépenses et remboursements</p>
        </div>
        <Button onClick={() => setOuvert(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nouvelle transaction
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solde du jour</p>
                <p className={`text-2xl font-bold ${solde >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatFCFA(solde)}</p>
              </div>
              <Wallet className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Encaissements</p>
                <p className="text-2xl font-bold text-emerald-600">{formatFCFA(total_encaissements)}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dépenses</p>
                <p className="text-2xl font-bold text-red-600">{formatFCFA(total_depenses)}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <ArrowDownLeft className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Remboursements</p>
                <p className="text-2xl font-bold text-amber-600">{formatFCFA(total_remboursements)}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journal */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={onglet} onValueChange={setOnglet} className="mb-4">
            <TabsList>
              <TabsTrigger value="tout">Toutes ({transactions.length})</TabsTrigger>
              <TabsTrigger value="encaissement">Encaissements</TabsTrigger>
              <TabsTrigger value="depense">Dépenses</TabsTrigger>
              <TabsTrigger value="remboursement">Remboursements</TabsTrigger>
            </TabsList>
          </Tabs>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement…</TableCell>
                </TableRow>
              ) : filtre.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune transaction</TableCell>
                </TableRow>
              ) : (
                filtre.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{t.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={COULEUR_TYPE[t.type]}>
                        {LABEL_TYPE[t.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        {ICONE_METHODE[t.methode]}
                        {METHODE_PAIEMENT[t.methode]}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateHeure(t.createdAt)}</TableCell>
                    <TableCell className={`text-right font-bold ${t.type === "encaissement" ? "text-emerald-600" : t.type === "depense" ? "text-red-600" : "text-amber-600"}`}>
                      {t.type === "encaissement" ? "+" : "-"}{formatFCFA(t.montant)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={soumettre} className="space-y-4 pt-2">
            <div>
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as TypeTransaction }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="encaissement">Encaissement</SelectItem>
                  <SelectItem value="depense">Dépense</SelectItem>
                  <SelectItem value="remboursement">Remboursement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description *</Label>
              <Input className="mt-1" placeholder="Ex: Vente billets, carburant…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Montant (FCFA) *</Label>
                <Input className="mt-1" type="number" placeholder="0" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} />
              </div>
              <div>
                <Label>Méthode</Label>
                <Select value={form.methode} onValueChange={(v) => setForm(f => ({ ...f, methode: v as MethodePaiement }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(METHODE_PAIEMENT).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOuvert(false)}>Annuler</Button>
              <Button type="submit" disabled={createTransaction.isPending}>
                {createTransaction.isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
