import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { Bus, Loader2, MapPin, Calendar, Clock, CheckCircle2, Ticket, ArrowLeft, Users, Search, Tag } from "lucide-react";

type FieldMode = "hidden" | "optional" | "required";
type CustomFieldType = "text" | "textarea" | "phone" | "email" | "number" | "date" | "select";
interface CustomField { key: string; label: string; type: CustomFieldType; required: boolean; placeholder?: string; options?: string[]; }
interface BookingConfig { welcomeMessage?: string; fields: { email: FieldMode; idNumber: FieldMode; seat: FieldMode }; customFields: CustomField[]; }
interface PublicCompany { name: string; country: string; currency: string; bookingConfig: BookingConfig; }
interface Routes { origins: string[]; destinations: string[]; pairs: { origin: string; destination: string }[]; }
interface PublicTrip { id: number; departureDate: string; departureTime: string; originCity: string; destinationCity: string; price: number; offerType: string | null; seatsAvailable: number; seatsTotal: number; isFull: boolean; bookable: boolean; reason: string | null; }
interface Confirmation { ticketCode: string; passengerName: string; seatNumber: string | null; price: number; currency: string; originCity: string; destinationCity: string; departureDate: string; departureTime: string; offerType: string | null; companyName: string; }

const fmtFCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const fmtDate = (s: string) => { try { return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(s)); } catch { return s; } };
const todayISO = () => new Date().toISOString().split("T")[0];

export default function PublicBooking() {
  const [, params] = useRoute("/book/:slug");
  const slug = params?.slug ?? "";

  const companyQ = useQuery({ queryKey: ["/api/public/company", slug], queryFn: () => apiFetch<PublicCompany>(`/api/public/company/${slug}`), retry: false });
  const routesQ = useQuery({ queryKey: ["/api/public/company", slug, "routes"], queryFn: () => apiFetch<Routes>(`/api/public/company/${slug}/routes`), enabled: companyQ.isSuccess, retry: false });

  // search criteria
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [date, setDate] = useState<string>(todayISO());
  const [searched, setSearched] = useState(false);

  const tripsQ = useQuery({
    queryKey: ["/api/public/company", slug, "trips", origin, destination, date],
    queryFn: () => {
      const qs = new URLSearchParams({ date });
      if (origin) qs.set("origin", origin);
      if (destination) qs.set("destination", destination);
      return apiFetch<PublicTrip[]>(`/api/public/company/${slug}/trips?${qs.toString()}`);
    },
    enabled: companyQ.isSuccess && searched,
    retry: false,
  });

  const [selected, setSelected] = useState<PublicTrip | null>(null);
  const [form, setForm] = useState({ passengerName: "", passengerPhone: "", passengerEmail: "", passengerIdNumber: "", seatNumber: "" });
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const config = companyQ.data?.bookingConfig;

  // destinations reachable from chosen origin
  const reachable = origin && routesQ.data ? [...new Set(routesQ.data.pairs.filter(p => p.origin === origin).map(p => p.destination))] : routesQ.data?.destinations ?? [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { tripId: selected.id, passengerName: form.passengerName, passengerPhone: form.passengerPhone };
      if (config?.fields.email !== "hidden" && form.passengerEmail) payload.passengerEmail = form.passengerEmail;
      if (config?.fields.idNumber !== "hidden" && form.passengerIdNumber) payload.passengerIdNumber = form.passengerIdNumber;
      if (config?.fields.seat !== "hidden" && form.seatNumber) payload.seatNumber = form.seatNumber;
      if (config?.customFields.length) payload.customData = customValues;
      const res = await apiFetch<Confirmation>(`/api/public/company/${slug}/reservations`, { method: "POST", body: JSON.stringify(payload) });
      setConfirmation(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (companyQ.isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (companyQ.isError || !companyQ.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-6">
        <Card className="max-w-sm text-center"><CardContent className="pt-8 pb-6 space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center"><Bus className="h-6 w-6 text-destructive" /></div>
          <h2 className="font-semibold">Page de réservation introuvable</h2>
          <p className="text-sm text-muted-foreground">Ce lien est invalide ou la réservation en ligne est désactivée.</p>
        </CardContent></Card>
      </div>
    );
  }
  const company = companyQ.data;

  if (confirmation) {
    const qrData = JSON.stringify({ code: confirmation.ticketCode, passenger: confirmation.passengerName, route: `${confirmation.originCity}→${confirmation.destinationCity}`, date: confirmation.departureDate });
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center"><CheckCircle2 className="h-7 w-7 text-primary" /></div>
            <div><h2 className="text-xl font-bold">Réservation confirmée !</h2><p className="text-sm text-muted-foreground">Présentez ce billet à l'embarquement.</p></div>
            <div className="rounded-xl border bg-card p-5 text-left space-y-3">
              <div className="flex items-center justify-between"><span className="font-mono text-lg font-bold text-primary">{confirmation.ticketCode}</span><Badge variant="outline">{confirmation.companyName}</Badge></div>
              <div className="flex justify-center py-2"><QRCodeSVG value={qrData} size={140} /></div>
              <div className="text-sm space-y-1">
                <p className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {confirmation.passengerName}</p>
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {confirmation.originCity} → {confirmation.destinationCity}</p>
                <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> {fmtDate(confirmation.departureDate)} à {confirmation.departureTime}</p>
                {confirmation.offerType && <p className="flex items-center gap-2"><Tag className="h-4 w-4 text-muted-foreground" /> {confirmation.offerType}</p>}
                {confirmation.seatNumber && <p className="flex items-center gap-2"><Ticket className="h-4 w-4 text-muted-foreground" /> Siège {confirmation.seatNumber}</p>}
                <p className="font-bold text-base pt-1">{fmtFCFA(confirmation.price)}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => { setConfirmation(null); setSelected(null); setForm({ passengerName: "", passengerPhone: "", passengerEmail: "", passengerIdNumber: "", seatNumber: "" }); setCustomValues({}); }}>Nouvelle réservation</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-2xl px-4 py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center"><Bus className="w-6 h-6" /></div>
          <div><h1 className="font-bold text-lg leading-tight">{company.name}</h1><p className="text-xs text-primary-foreground/80">Réservation en ligne</p></div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {config?.welcomeMessage && <p className="text-center text-muted-foreground">{config.welcomeMessage}</p>}

        {/* STEP 1 — search */}
        {!selected && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4 text-primary" /> Rechercher un voyage</CardTitle><CardDescription>Choisissez votre trajet et la date.</CardDescription></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Départ</Label>
                  <Select value={origin} onValueChange={(v) => { setOrigin(v); setDestination(""); }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Ville de départ" /></SelectTrigger>
                    <SelectContent>{routesQ.data?.origins.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Arrivée</Label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Ville d'arrivée" /></SelectTrigger>
                    <SelectContent>{reachable.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input className="mt-1" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <Button className="w-full mt-4 gap-1" onClick={() => setSearched(true)}><Search className="h-4 w-4" /> Voir les voyages</Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 2 — day's trips */}
        {!selected && searched && (
          <div className="space-y-3">
            <h2 className="font-semibold">Voyages du {fmtDate(date)}</h2>
            {tripsQ.isLoading && <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>}
            {tripsQ.data?.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Aucun voyage ce jour-là pour ce trajet.</CardContent></Card>}
            {tripsQ.data?.map((t) => (
              <Card key={t.id} className={t.bookable ? "hover:border-primary hover:shadow-md transition-all" : "opacity-70"}>
                <CardContent className="py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 text-primary flex-shrink-0" /> {t.departureTime}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {t.originCity} → {t.destinationCity}</span>
                      {t.offerType && <Badge variant="outline" className="text-[10px] py-0">{t.offerType}</Badge>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-primary">{fmtFCFA(t.price)}</div>
                    {t.isFull ? <Badge variant="outline" className="mt-1 text-[10px] border-destructive/40 text-destructive">Complet</Badge>
                      : t.reason === "trop_tard" ? <Badge variant="outline" className="mt-1 text-[10px]">Hors réservation</Badge>
                      : <Button size="sm" className="mt-1 h-7" onClick={() => setSelected(t)}>Réserver</Button>}
                    {!t.isFull && <div className="text-[10px] text-muted-foreground mt-1">{t.seatsAvailable} place(s)</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* STEP 3 — passenger form */}
        {selected && (
          <Card>
            <CardHeader>
              <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"><ArrowLeft className="h-4 w-4" /> Retour aux voyages</button>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> {selected.originCity} → {selected.destinationCity}</CardTitle>
              <CardDescription>{fmtDate(selected.departureDate)} à {selected.departureTime}{selected.offerType ? ` · ${selected.offerType}` : ""} · {fmtFCFA(selected.price)}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div><Label className="text-xs">Nom complet *</Label><Input className="mt-1" value={form.passengerName} onChange={(e) => setForm({ ...form, passengerName: e.target.value })} placeholder="Votre nom" required minLength={2} /></div>
                <div><Label className="text-xs">Téléphone *</Label><Input className="mt-1" value={form.passengerPhone} onChange={(e) => setForm({ ...form, passengerPhone: e.target.value })} placeholder="+237 6 00 00 00 00" required /></div>
                {config?.fields.email !== "hidden" && <div><Label className="text-xs">Email {config?.fields.email === "required" ? "*" : "(optionnel)"}</Label><Input className="mt-1" type="email" value={form.passengerEmail} onChange={(e) => setForm({ ...form, passengerEmail: e.target.value })} required={config?.fields.email === "required"} /></div>}
                {config?.fields.idNumber !== "hidden" && <div><Label className="text-xs">Pièce d'identité {config?.fields.idNumber === "required" ? "*" : "(optionnel)"}</Label><Input className="mt-1" value={form.passengerIdNumber} onChange={(e) => setForm({ ...form, passengerIdNumber: e.target.value })} required={config?.fields.idNumber === "required"} /></div>}
                {config?.fields.seat !== "hidden" && <div><Label className="text-xs">Siège souhaité {config?.fields.seat === "required" ? "*" : "(optionnel)"}</Label><Input className="mt-1" value={form.seatNumber} onChange={(e) => setForm({ ...form, seatNumber: e.target.value })} required={config?.fields.seat === "required"} /></div>}

                {/* Custom company-defined fields */}
                {config?.customFields.map((f) => (
                  <div key={f.key}>
                    <Label className="text-xs">{f.label} {f.required ? "*" : "(optionnel)"}</Label>
                    {f.type === "textarea" ? (
                      <Textarea className="mt-1" value={customValues[f.key] ?? ""} placeholder={f.placeholder} required={f.required} onChange={(e) => setCustomValues({ ...customValues, [f.key]: e.target.value })} />
                    ) : f.type === "select" ? (
                      <Select value={customValues[f.key] ?? ""} onValueChange={(v) => setCustomValues({ ...customValues, [f.key]: v })}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                        <SelectContent>{(f.options ?? []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input className="mt-1" type={f.type === "phone" ? "tel" : f.type} value={customValues[f.key] ?? ""} placeholder={f.placeholder} required={f.required} onChange={(e) => setCustomValues({ ...customValues, [f.key]: e.target.value })} />
                    )}
                  </div>
                ))}

                {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Réserver — {fmtFCFA(selected.price)}</>}</Button>
                <p className="text-xs text-center text-muted-foreground">Paiement à effectuer à l'agence ou à l'embarquement.</p>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
      <footer className="py-8 text-center text-xs text-muted-foreground">Propulsé par <span className="font-semibold text-foreground">MuraTravel</span></footer>
    </div>
  );
}
