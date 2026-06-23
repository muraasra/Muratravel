import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatDateHeure } from "@/lib/fcfa";
import { Bell, Send, Mail, MessageSquare, CheckCircle2, Clock, XCircle } from "lucide-react";

type Canal = "sms" | "email" | "whatsapp";
type StatutNotif = "envoyee" | "en_attente" | "echec";
type Declencheur = "confirmation_reservation" | "modification_voyage" | "annulation_voyage" | "rappel_depart" | "manuel";

interface Notification {
  id: number;
  canal: Canal;
  declencheur: string;
  destinataire: string;
  message: string;
  statut: StatutNotif;
  createdAt: string;
}

// The API stores the config as flat booleans, and only models the channels that
// are actually wired per event (e.g. no WhatsApp for "modification"). Drive the
// UI from this declarative mapping so we never render a toggle that the backend
// cannot persist.
interface NotifConfig {
  confirmationSms: boolean;
  confirmationEmail: boolean;
  confirmationWhatsapp: boolean;
  modificationSms: boolean;
  modificationEmail: boolean;
  annulationSms: boolean;
  annulationEmail: boolean;
  rappelSms: boolean;
  rappelWhatsapp: boolean;
}

const LABEL_DECLENCHEUR: Record<Declencheur, string> = {
  confirmation_reservation: "Confirmation réservation",
  modification_voyage: "Modification voyage",
  annulation_voyage: "Annulation voyage",
  rappel_depart: "Rappel départ",
  manuel: "Envoi manuel",
};

const CONFIG_SECTIONS: { label: string; channels: Partial<Record<Canal, keyof NotifConfig>> }[] = [
  { label: LABEL_DECLENCHEUR.confirmation_reservation, channels: { sms: "confirmationSms", email: "confirmationEmail", whatsapp: "confirmationWhatsapp" } },
  { label: LABEL_DECLENCHEUR.modification_voyage, channels: { sms: "modificationSms", email: "modificationEmail" } },
  { label: LABEL_DECLENCHEUR.annulation_voyage, channels: { sms: "annulationSms", email: "annulationEmail" } },
  { label: LABEL_DECLENCHEUR.rappel_depart, channels: { sms: "rappelSms", whatsapp: "rappelWhatsapp" } },
];

const ICONE_CANAL: Record<Canal, React.ReactNode> = {
  sms: <MessageSquare className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  whatsapp: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>,
};

const COULEUR_STATUT: Record<StatutNotif, string> = {
  envoyee: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  en_attente: "bg-amber-500/10 text-amber-600 border-amber-200",
  echec: "bg-red-500/10 text-red-600 border-red-200",
};

const ICONE_STATUT: Record<StatutNotif, React.ReactNode> = {
  envoyee: <CheckCircle2 className="h-3 w-3" />,
  en_attente: <Clock className="h-3 w-3" />,
  echec: <XCircle className="h-3 w-3" />,
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [onglet, setOnglet] = useState("historique");
  const [config, setConfig] = useState<NotifConfig | null>(null);
  const [form, setForm] = useState({
    canal: "sms" as Canal,
    destinataire: "",
    message: "",
  });

  const { data: notifs = [] } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: () => apiFetch<Notification[]>("/api/notifications"),
  });

  const { data: configData } = useQuery({
    queryKey: ["/api/notifications/config"],
    queryFn: () => apiFetch<NotifConfig>("/api/notifications/config"),
  });

  // Seed the editable draft once the server config arrives.
  useEffect(() => {
    if (configData) setConfig(configData);
  }, [configData]);

  const envoyerNotif = useMutation({
    mutationFn: (body: { canal: Canal; declencheur: string; destinataire: string; message: string }) =>
      apiFetch<Notification>("/api/notifications", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: `Notification ${vars.canal.toUpperCase()} en file d'envoi` });
      setOuvert(false);
      setForm({ canal: "sms", destinataire: "", message: "" });
    },
    onError: (err: Error) => toast({ title: "Erreur lors de l'envoi", description: err.message, variant: "destructive" }),
  });

  const saveConfig = useMutation({
    mutationFn: (body: NotifConfig) =>
      apiFetch<NotifConfig>("/api/notifications/config", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/notifications/config"] });
      toast({ title: "Configuration sauvegardée" });
    },
    onError: (err: Error) => toast({ title: "Erreur lors de la sauvegarde", description: err.message, variant: "destructive" }),
  });

  function toggleField(field: keyof NotifConfig) {
    setConfig(c => (c ? { ...c, [field]: !c[field] } : c));
  }

  function envoyerManuel(e: React.FormEvent) {
    e.preventDefault();
    if (!form.destinataire || !form.message) {
      toast({ title: "Champs requis manquants", variant: "destructive" });
      return;
    }
    envoyerNotif.mutate({ ...form, declencheur: "manuel" });
  }

  const stats = {
    envoyees: notifs.filter(n => n.statut === "envoyee").length,
    en_attente: notifs.filter(n => n.statut === "en_attente").length,
    echecs: notifs.filter(n => n.statut === "echec").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">SMS, Email et WhatsApp automatiques</p>
        </div>
        <Button onClick={() => setOuvert(true)}>
          <Send className="h-4 w-4 mr-2" /> Envoyer manuellement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">Envoyées</p><p className="text-2xl font-bold text-emerald-600">{stats.envoyees}</p></div>
            <CheckCircle2 className="h-8 w-8 text-emerald-500/20" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">En attente</p><p className="text-2xl font-bold text-amber-600">{stats.en_attente}</p></div>
            <Clock className="h-8 w-8 text-amber-500/20" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">Échecs</p><p className="text-2xl font-bold text-red-600">{stats.echecs}</p></div>
            <XCircle className="h-8 w-8 text-red-500/20" />
          </div>
        </CardContent></Card>
      </div>

      <Tabs value={onglet} onValueChange={setOnglet}>
        <TabsList>
          <TabsTrigger value="historique">Historique</TabsTrigger>
          <TabsTrigger value="configuration">Configuration automatique</TabsTrigger>
        </TabsList>
      </Tabs>

      {onglet === "historique" && (
        <Card>
          <CardHeader><CardTitle>Historique des notifications</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead>Déclencheur</TableHead>
                  <TableHead>Destinataire</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune notification</TableCell>
                  </TableRow>
                ) : (
                  notifs.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm capitalize">
                          {ICONE_CANAL[n.canal]}{n.canal.toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{LABEL_DECLENCHEUR[n.declencheur as Declencheur] ?? n.declencheur}</TableCell>
                      <TableCell className="text-sm font-mono">{n.destinataire}</TableCell>
                      <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">{n.message}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${COULEUR_STATUT[n.statut]} gap-1`}>
                          {ICONE_STATUT[n.statut]}
                          {n.statut.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateHeure(n.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {onglet === "configuration" && (
        <Card>
          <CardHeader><CardTitle>Envois automatiques par événement</CardTitle></CardHeader>
          <CardContent>
            {!config ? (
              <p className="text-sm text-muted-foreground py-4">Chargement de la configuration…</p>
            ) : (
              <div className="space-y-6">
                {CONFIG_SECTIONS.map((section) => (
                  <div key={section.label} className="border rounded-lg p-4">
                    <p className="font-medium mb-3">{section.label}</p>
                    <div className="flex gap-8">
                      {(Object.entries(section.channels) as [Canal, keyof NotifConfig][]).map(([canal, field]) => (
                        <div key={canal} className="flex items-center gap-2">
                          <Switch checked={config[field]} onCheckedChange={() => toggleField(field)} />
                          <div className="flex items-center gap-1.5 text-sm">
                            {ICONE_CANAL[canal]}
                            <span className="capitalize">{canal}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <Button
                  disabled={saveConfig.isPending}
                  onClick={() => saveConfig.mutate({
                    confirmationSms: config.confirmationSms,
                    confirmationEmail: config.confirmationEmail,
                    confirmationWhatsapp: config.confirmationWhatsapp,
                    modificationSms: config.modificationSms,
                    modificationEmail: config.modificationEmail,
                    annulationSms: config.annulationSms,
                    annulationEmail: config.annulationEmail,
                    rappelSms: config.rappelSms,
                    rappelWhatsapp: config.rappelWhatsapp,
                  })}
                >
                  {saveConfig.isPending ? "Sauvegarde…" : "Sauvegarder la configuration"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Envoi manuel
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={envoyerManuel} className="space-y-4 pt-2">
            <div>
              <Label>Canal *</Label>
              <Select value={form.canal} onValueChange={(v) => setForm(f => ({ ...f, canal: v as Canal }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destinataire *</Label>
              <Input className="mt-1" placeholder={form.canal === "email" ? "client@email.com" : "+221 77 xxx xxxx"} value={form.destinataire} onChange={e => setForm(f => ({ ...f, destinataire: e.target.value }))} />
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea className="mt-1" rows={4} placeholder="Contenu du message…" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">{form.message.length} caractères</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOuvert(false)}>Annuler</Button>
              <Button type="submit" className="gap-1" disabled={envoyerNotif.isPending}>
                <Send className="h-3.5 w-3.5" /> {envoyerNotif.isPending ? "Envoi…" : "Envoyer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
