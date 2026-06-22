import { useState, useRef } from "react";
import { useGetReservation, useBoardPassenger, useListBaggage, useCreateBaggage, useUpdateBaggage } from "@workspace/api-client-react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QRCodeSVG } from "qrcode.react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  formatFCFA,
  formatDate,
  formatDateHeure,
  couleurStatutReservation,
  couleurStatutBagage,
  STATUT_RESERVATION,
  STATUT_BAGAGE,
  TYPE_BAGAGE,
  TARIF_BAGAGE,
} from "@/lib/fcfa";
import {
  Ticket,
  User,
  MapPin,
  Calendar,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Luggage,
  Plus,
  Weight,
  ChevronRight,
  Package,
  Truck,
  PackageCheck,
  Printer,
} from "lucide-react";

const FLUX_STATUT: Record<string, string | null> = {
  registered: "checked",
  checked: "loaded",
  loaded: "delivered",
  delivered: null,
};

const LABEL_AVANCER: Record<string, string> = {
  registered: "Vérifier",
  checked: "Charger",
  loaded: "Livrer",
};

const ICONE_STATUT: Record<string, React.ReactNode> = {
  registered: <Package className="h-3 w-3" />,
  checked: <CheckCircle2 className="h-3 w-3" />,
  loaded: <Truck className="h-3 w-3" />,
  delivered: <PackageCheck className="h-3 w-3" />,
};

export default function DetailReservation() {
  const [, params] = useRoute("/reservations/:id");
  const [, navigate] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: reservation, isLoading } = useGetReservation(id, { query: { enabled: !!id, queryKey: [`/api/reservations/${id}`] } });
  const { data: bagages } = useListBaggage({ reservationId: id }, { query: { enabled: !!id, queryKey: ["/api/baggage", { reservationId: id }] } });
  const boardPassenger = useBoardPassenger();
  const createBaggage = useCreateBaggage();
  const updateBaggage = useUpdateBaggage();
  const qc = useQueryClient();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [modalBagage, setModalBagage] = useState(false);
  const [formBagage, setFormBagage] = useState({
    type: "standard",
    weight: "",
    price: String(TARIF_BAGAGE["standard"]),
    notes: "",
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-80 bg-muted rounded-lg" />
      </div>
    );
  }
  if (!reservation) return <div className="text-muted-foreground">Réservation introuvable.</div>;

  const totalBagages = bagages?.reduce((s, b) => s + (b.price ?? 0), 0) ?? 0;
  const poidsTotalBagages = bagages?.reduce((s, b) => s + (b.weight ?? 0), 0) ?? 0;
  const totalFacture = (reservation.price ?? 0) + totalBagages;

  const qrData = JSON.stringify({
    code: reservation.ticketCode,
    id: reservation.id,
    passenger: reservation.passengerName,
    seat: reservation.seatNumber,
    route: `${reservation.originCity ?? ""}→${reservation.destinationCity ?? ""}`,
    date: reservation.departureDate,
  });

  function imprimer() {
    if (!reservation) return;
    const contenu = printRef.current;
    if (!contenu) return;
    const fenetre = window.open("", "_blank", "width=400,height=600");
    if (!fenetre) return;
    fenetre.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Billet ${reservation.ticketCode}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; width: 80mm; background: white; }
            @media print { @page { margin: 0; size: 80mm auto; } body { width: 80mm; } }
          </style>
        </head>
        <body>${contenu.innerHTML}</body>
      </html>
    `);
    fenetre.document.close();
    fenetre.focus();
    setTimeout(() => { fenetre.print(); }, 300);
  }

  async function embarquer() {
    await boardPassenger.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: [`/api/reservations/${id}`] });
    qc.invalidateQueries({ queryKey: ["/api/reservations"] });
    toast({ title: "Passager embarqué avec succès" });
  }

  function changerType(type: string) {
    setFormBagage((f) => ({ ...f, type, price: String(TARIF_BAGAGE[type] ?? 500) }));
  }

  async function ajouterBagage(e: React.FormEvent) {
    e.preventDefault();
    if (!formBagage.weight) {
      toast({ title: "Le poids est requis", variant: "destructive" });
      return;
    }
    try {
      await createBaggage.mutateAsync({
        data: {
          reservationId: id,
          type: formBagage.type as "standard" | "fragile" | "oversized" | "valuable",
          weight: parseFloat(formBagage.weight),
          price: parseFloat(formBagage.price),
          notes: formBagage.notes || undefined,
          status: "registered",
        },
      });
      qc.invalidateQueries({ queryKey: ["/api/baggage"] });
      toast({ title: "Bagage ajouté à la réservation" });
      setModalBagage(false);
      setFormBagage({ type: "standard", weight: "", price: String(TARIF_BAGAGE["standard"]), notes: "" });
    } catch {
      toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
    }
  }

  async function avancerStatut(bagId: number, statutActuel: string) {
    const prochain = FLUX_STATUT[statutActuel];
    if (!prochain) return;
    await updateBaggage.mutateAsync({
      id: bagId,
      data: { status: prochain as "registered" | "checked" | "loaded" | "delivered" | "lost" | "damaged" },
    });
    qc.invalidateQueries({ queryKey: ["/api/baggage"] });
    toast({ title: `Bagage → ${STATUT_BAGAGE[prochain]}` });
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reservations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billet #{reservation.id}</h1>
            <p className="text-sm text-muted-foreground font-mono">{reservation.ticketCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={couleurStatutReservation(reservation.status)}>
            {STATUT_RESERVATION[reservation.status] ?? reservation.status}
          </Badge>
          <Button size="sm" variant="outline" className="gap-1" onClick={imprimer}>
            <Printer className="h-4 w-4" /> Imprimer
          </Button>
          {reservation.status !== "boarded" && reservation.status !== "cancelled" && (
            <Button size="sm" className="gap-1" onClick={embarquer} disabled={boardPassenger.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              {boardPassenger.isPending ? "…" : "Embarquer"}
            </Button>
          )}
        </div>
      </div>

      {/* Billet imprimable (caché visuellement mais utilisé pour print) */}
      <div ref={printRef} style={{ display: "none" }}>
        <div style={{ fontFamily: "Arial, sans-serif", width: "80mm", background: "white", color: "black" }}>
          {/* Header */}
          <div style={{ background: "#1e40af", color: "white", padding: "10px 12px" }}>
            <div style={{ fontWeight: "bold", fontSize: "14px" }}>MuraTravel</div>
            <div style={{ fontSize: "10px", opacity: 0.8 }}>Billet de Voyage</div>
          </div>
          {/* Route */}
          <div style={{ padding: "10px 12px", borderBottom: "1px dashed #ccc", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>
              {reservation.originCity} → {reservation.destinationCity}
            </div>
            <div style={{ fontSize: "11px", color: "#666" }}>{formatDate(reservation.departureDate)}</div>
          </div>
          {/* Passager */}
          <div style={{ padding: "8px 12px", borderBottom: "1px dashed #ccc" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "9px", color: "#888" }}>PASSAGER</div>
                <div style={{ fontWeight: "bold", fontSize: "13px" }}>{reservation.passengerName}</div>
                <div style={{ fontSize: "10px" }}>{reservation.passengerPhone}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "9px", color: "#888" }}>SIÈGE</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1e40af" }}>{reservation.seatNumber ?? "—"}</div>
              </div>
            </div>
            <div style={{ marginTop: "6px", fontSize: "10px", color: "#555" }}>
              Tarif: <strong>{formatFCFA(reservation.price)}</strong> ·
              Bagages: <strong>{bagages?.length ?? 0}</strong>
            </div>
          </div>
          {/* QR Code */}
          <div style={{ padding: "10px 12px", display: "flex", gap: "12px", alignItems: "center", borderBottom: "1px dashed #ccc" }}>
            <QRCodeSVG value={qrData} size={80} level="M" />
            <div>
              <div style={{ fontSize: "9px", color: "#888" }}>CODE BILLET</div>
              <div style={{ fontFamily: "monospace", fontWeight: "bold", fontSize: "13px", color: "#1e40af", letterSpacing: "1px" }}>
                {reservation.ticketCode}
              </div>
              <div style={{ marginTop: "4px", fontSize: "9px", color: "#888" }}>Scannable à l'embarquement</div>
            </div>
          </div>
          {/* Coupon contrôle */}
          <div style={{ padding: "6px 12px", background: "#f3f4f6", display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
            <span style={{ fontFamily: "monospace" }}>{reservation.ticketCode}</span>
            <span>{reservation.passengerName.split(" ")[0]}</span>
            <span>S.{reservation.seatNumber ?? "—"}</span>
          </div>
          <div style={{ textAlign: "center", padding: "4px", fontSize: "8px", color: "#aaa" }}>
            MuraTravel · Voyage en toute sécurité
          </div>
        </div>
      </div>

      {/* Carte billet visible dans l'UI */}
      <Card className="border-2 border-primary/20 overflow-hidden">
        <div className="bg-primary/10 px-6 py-4 flex justify-between items-center border-b border-primary/10">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Ticket className="h-5 w-5" />
            E-Billet MuraTravel
          </div>
          <div className="text-sm font-mono bg-white px-3 py-1.5 rounded border shadow-sm tracking-widest">
            {reservation.ticketCode || `TKT-${String(reservation.id).padStart(6, "0")}`}
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center mb-1">
                  <User className="w-3.5 h-3.5 mr-1" /> Passager
                </div>
                <div className="font-semibold text-lg">{reservation.passengerName}</div>
                <div className="text-sm text-muted-foreground">{reservation.passengerPhone}</div>
                {reservation.passengerEmail && (
                  <div className="text-sm text-muted-foreground">{reservation.passengerEmail}</div>
                )}
              </div>

              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center mb-1">
                  <MapPin className="w-3.5 h-3.5 mr-1" /> Itinéraire
                </div>
                <div className="font-semibold text-base">{reservation.originCity} → {reservation.destinationCity}</div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center mb-1">
                  <Calendar className="w-3.5 h-3.5 mr-1" /> Date de départ
                </div>
                <div className="font-semibold">{formatDate(reservation.departureDate)}</div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Siège</div>
                  <div className="font-bold text-3xl font-mono">{reservation.seatNumber || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center justify-end mb-1">
                    <CreditCard className="w-3.5 h-3.5 mr-1" /> Tarif
                  </div>
                  <div className="font-bold text-xl">{formatFCFA(reservation.price)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code réel */}
          <div className="mt-8 pt-8 border-t border-dashed">
            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                Réservation créée le{" "}
                {reservation.createdAt
                  ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(reservation.createdAt))
                  : "—"}
              </div>
              <div className="flex flex-col items-center">
                <div className="p-1.5 border-2 border-border rounded-lg bg-white shadow-sm">
                  <QRCodeSVG
                    value={qrData}
                    size={80}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Scanner à l'embarquement</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Bagages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Luggage className="h-4 w-4" /> Bagages enregistrés
            {bagages && bagages.length > 0 && (
              <Badge className="ml-1">{bagages.length}</Badge>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => setModalBagage(true)}>
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {!bagages || bagages.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-sm">
              Aucun bagage enregistré.{" "}
              <button className="text-primary hover:underline" onClick={() => setModalBagage(true)}>
                Ajouter un bagage
              </button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code de suivi</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Poids</TableHead>
                    <TableHead>Frais</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bagages.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex gap-px h-5">
                            {Array.from(b.trackingCode ?? "").map((c, i) => (
                              <div
                                key={i}
                                className="bg-foreground rounded-sm"
                                style={{ width: `${((c.charCodeAt(0) % 3) + 1) * 1.5}px`, opacity: 0.7 }}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
                            {b.trackingCode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Weight className="h-3 w-3 text-muted-foreground" />
                          {TYPE_BAGAGE[b.type] ?? b.type}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{b.weight} kg</TableCell>
                      <TableCell className="font-semibold text-sm">{formatFCFA(b.price)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${couleurStatutBagage(b.status)} text-xs gap-1`}>
                          <span>{ICONE_STATUT[b.status]}</span>
                          {STATUT_BAGAGE[b.status] ?? b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {FLUX_STATUT[b.status] && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs gap-1 px-2"
                            onClick={() => avancerStatut(b.id, b.status)}
                            disabled={updateBaggage.isPending}
                          >
                            {LABEL_AVANCER[b.status]}
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {bagages.length} bagage(s) · {poidsTotalBagages.toFixed(1)} kg total
                  </span>
                  <span>Frais bagages : <strong>{formatFCFA(totalBagages)}</strong></span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Billet</span>
                  <span>{formatFCFA(reservation.price)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total à payer</span>
                  <span className="text-lg text-primary">{formatFCFA(totalFacture)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal ajout bagage */}
      <Dialog open={modalBagage} onOpenChange={setModalBagage}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Luggage className="h-5 w-5" /> Ajouter un bagage
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={ajouterBagage} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Type de bagage</Label>
                <Select value={formBagage.type} onValueChange={changerType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_BAGAGE).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v} — {formatFCFA(TARIF_BAGAGE[k])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Poids (kg) *</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="0.1"
                  placeholder="10.0"
                  value={formBagage.weight}
                  onChange={(e) => setFormBagage((f) => ({ ...f, weight: e.target.value }))}
                />
              </div>
              <div>
                <Label>Frais (FCFA)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={formBagage.price}
                  onChange={(e) => setFormBagage((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Input
                  className="mt-1"
                  placeholder="Fragile, contenu spécial…"
                  value={formBagage.notes}
                  onChange={(e) => setFormBagage((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 flex justify-between">
              <span className="text-sm text-muted-foreground">Nouveau total</span>
              <strong>{formatFCFA((reservation.price ?? 0) + totalBagages + (parseFloat(formBagage.price) || 0))}</strong>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalBagage(false)}>Annuler</Button>
              <Button type="submit" disabled={createBaggage.isPending}>
                {createBaggage.isPending ? "…" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
