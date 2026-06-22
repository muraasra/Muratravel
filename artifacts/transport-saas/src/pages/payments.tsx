import { useListPayments } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFCFA, formatDate, METHODE_PAIEMENT, STATUT_PAIEMENT } from "@/lib/fcfa";
import { Banknote, TrendingUp, CreditCard, Smartphone } from "lucide-react";

export default function Paiements() {
  const { data: payments, isLoading } = useListPayments();

  const total = payments?.reduce((s, p) => s + (p.status === "completed" ? p.amount : 0), 0) ?? 0;
  const parMobile = payments?.filter((p) => p.method === "mobile_money" && p.status === "completed").reduce((s, p) => s + p.amount, 0) ?? 0;
  const parCarte = payments?.filter((p) => p.method === "card" && p.status === "completed").reduce((s, p) => s + p.amount, 0) ?? 0;
  const parEspeces = payments?.filter((p) => p.method === "cash" && p.status === "completed").reduce((s, p) => s + p.amount, 0) ?? 0;

  function couleurMethode(method: string) {
    switch (method) {
      case "mobile_money": return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
      case "card": return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "cash": return "bg-amber-500/10 text-amber-700 border-amber-200";
      case "bank_transfer": return "bg-violet-500/10 text-violet-700 border-violet-200";
      default: return "bg-slate-500/10 text-slate-600 border-slate-200";
    }
  }

  function couleurStatut(status: string) {
    switch (status) {
      case "completed": return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
      case "pending": return "bg-amber-500/10 text-amber-700 border-amber-200";
      case "failed": return "bg-red-500/10 text-red-700 border-red-200";
      case "refunded": return "bg-slate-500/10 text-slate-600 border-slate-200";
      default: return "bg-slate-500/10 text-slate-600 border-slate-200";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
        <p className="text-muted-foreground text-sm mt-1">Historique des transactions</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total encaissé</p>
                <p className="text-xl font-bold mt-1">{formatFCFA(total)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-emerald-500/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Mobile Money</p>
                <p className="text-xl font-bold mt-1">{formatFCFA(parMobile)}</p>
              </div>
              <Smartphone className="h-6 w-6 text-emerald-500/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Carte bancaire</p>
                <p className="text-xl font-bold mt-1">{formatFCFA(parCarte)}</p>
              </div>
              <CreditCard className="h-6 w-6 text-blue-500/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Espèces</p>
                <p className="text-xl font-bold mt-1">{formatFCFA(parEspeces)}</p>
              </div>
              <Banknote className="h-6 w-6 text-amber-500/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Réservation</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement…</TableCell></TableRow>
              ) : payments?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune transaction</TableCell></TableRow>
              ) : (
                payments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">{formatDate(payment.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{payment.reference || `PAY-${payment.id}`}</TableCell>
                    <TableCell className="text-sm">#{payment.reservationId}</TableCell>
                    <TableCell className="font-semibold">{formatFCFA(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={couleurMethode(payment.method)}>
                        {METHODE_PAIEMENT[payment.method] ?? payment.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={couleurStatut(payment.status)}>
                        {STATUT_PAIEMENT[payment.status] ?? payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
