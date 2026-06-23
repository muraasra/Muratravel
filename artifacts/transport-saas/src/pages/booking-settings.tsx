import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link2, Copy, ExternalLink, RefreshCw, Loader2, Globe, QrCode, Plus, Trash2, GripVertical } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type FieldMode = "hidden" | "optional" | "required";
type CustomFieldType = "text" | "textarea" | "phone" | "email" | "number" | "date" | "select";
interface CustomField { key: string; label: string; type: CustomFieldType; required: boolean; placeholder?: string; options?: string[]; }
interface BookingConfig { welcomeMessage?: string; fields: { email: FieldMode; idNumber: FieldMode; seat: FieldMode }; customFields: CustomField[]; }
interface BookingSettings { slug: string; enabled: boolean; config: BookingConfig; }

const TYPE_LABELS: Record<CustomFieldType, string> = {
  text: "Texte court", textarea: "Texte long", phone: "Téléphone", email: "Email", number: "Nombre", date: "Date", select: "Liste de choix",
};
const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30) || "champ";

const FIELD_LABELS: Record<keyof BookingConfig["fields"], string> = {
  email: "Adresse email",
  idNumber: "Pièce d'identité (CNI/passeport)",
  seat: "Choix du siège",
};

export default function BookingSettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["/api/booking-config"], queryFn: () => apiFetch<BookingSettings>("/api/booking-config") });

  const [enabled, setEnabled] = useState(true);
  const [welcome, setWelcome] = useState("");
  const [fields, setFields] = useState<BookingConfig["fields"]>({ email: "optional", idNumber: "hidden", seat: "hidden" });
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled);
      setWelcome(data.config.welcomeMessage ?? "");
      setFields(data.config.fields);
      setCustomFields(data.config.customFields ?? []);
      setSlug(data.slug);
    }
  }, [data]);

  function addCustomField() {
    setCustomFields([...customFields, { key: `champ_${customFields.length + 1}`, label: "", type: "text", required: false }]);
  }
  function updateCustomField(i: number, patch: Partial<CustomField>) {
    setCustomFields(customFields.map((f, idx) => idx === i ? { ...f, ...patch } : f));
  }
  function removeCustomField(i: number) {
    setCustomFields(customFields.filter((_, idx) => idx !== i));
  }

  const publicUrl = slug ? `${window.location.origin}/book/${slug}` : "";

  async function save() {
    // Normalise custom fields: derive a stable key from the label, drop empty ones.
    const cleaned: CustomField[] = customFields
      .filter(f => f.label.trim())
      .map(f => ({
        ...f,
        key: f.key && f.key !== "" ? f.key : slugify(f.label),
        options: f.type === "select" ? (f.options ?? []).filter(o => o.trim()) : undefined,
      }));
    setSaving(true);
    try {
      const res = await apiFetch<BookingSettings>("/api/booking-config", {
        method: "PUT",
        body: JSON.stringify({ enabled, config: { welcomeMessage: welcome || undefined, fields, customFields: cleaned } }),
      });
      setCustomFields(res.config.customFields ?? []);
      qc.setQueryData(["/api/booking-config"], res);
      toast({ title: "Enregistré", description: "Votre formulaire de réservation a été mis à jour." });
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Échec", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function regenerate() {
    try {
      const res = await apiFetch<{ slug: string }>("/api/booking-config/regenerate", { method: "POST" });
      setSlug(res.slug);
      qc.invalidateQueries({ queryKey: ["/api/booking-config"] });
      toast({ title: "Nouveau lien généré", description: "L'ancien lien ne fonctionne plus." });
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Échec", variant: "destructive" });
    }
  }

  function copy() {
    navigator.clipboard.writeText(publicUrl);
    toast({ title: "Copié", description: "Lien copié dans le presse-papier." });
  }

  if (isLoading) return <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Globe className="h-6 w-6 text-primary" /> Réservation en ligne</h1>
        <p className="text-muted-foreground text-sm mt-1">Partagez votre lien public et personnalisez le formulaire que vos clients remplissent.</p>
      </div>

      {/* Public link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /> Votre lien de réservation</CardTitle>
          <CardDescription>Envoyez-le par SMS, WhatsApp, sur vos réseaux ou affichez le QR Code en agence.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="text-sm font-medium">Activer la réservation en ligne</Label>
              <p className="text-xs text-muted-foreground">Si désactivé, le lien affiche « réservation indisponible ».</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input readOnly value={publicUrl} className="font-mono text-sm" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={copy} className="gap-1 flex-1 sm:flex-none"><Copy className="h-4 w-4" /> Copier</Button>
              <Button variant="outline" asChild className="gap-1"><a href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Ouvrir</a></Button>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-2">
            {publicUrl && <div className="rounded-lg border p-2 bg-white"><QRCodeSVG value={publicUrl} size={96} /></div>}
            <div className="text-sm text-muted-foreground">
              <p className="flex items-center gap-1 font-medium text-foreground"><QrCode className="h-4 w-4" /> QR Code du lien</p>
              <p className="mt-1">Imprimez-le pour vos guichets et arrêts.</p>
              <Button variant="ghost" size="sm" onClick={regenerate} className="mt-2 gap-1 text-xs h-7 px-2"><RefreshCw className="h-3 w-3" /> Régénérer le lien</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form customization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personnaliser le formulaire</CardTitle>
          <CardDescription>« Nom » et « Téléphone » sont toujours demandés. Configurez les autres champs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-xs">Message d'accueil</Label>
            <Textarea className="mt-1" rows={2} maxLength={280} value={welcome} onChange={(e) => setWelcome(e.target.value)} placeholder="Ex. Réservez votre billet Douala–Yaoundé en 1 minute !" />
          </div>
          <div className="space-y-3">
            {(Object.keys(FIELD_LABELS) as Array<keyof BookingConfig["fields"]>).map((key) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <Label className="text-sm">{FIELD_LABELS[key]}</Label>
                <Select value={fields[key]} onValueChange={(v) => setFields({ ...fields, [key]: v as FieldMode })}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hidden">Masqué</SelectItem>
                    <SelectItem value="optional">Optionnel</SelectItem>
                    <SelectItem value="required">Obligatoire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Champs supplémentaires</CardTitle>
          <CardDescription>Ajoutez vos propres questions (point de ramassage, bagages, contact d'urgence…).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {customFields.length === 0 && <p className="text-sm text-muted-foreground">Aucun champ supplémentaire. Cliquez sur « Ajouter un champ ».</p>}
          {customFields.map((f, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-3 bg-muted/20">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input className="flex-1" placeholder="Intitulé du champ (ex. Point de ramassage)" value={f.label} onChange={(e) => updateCustomField(i, { label: e.target.value })} />
                <Button variant="ghost" size="icon" className="text-destructive flex-shrink-0" onClick={() => removeCustomField(i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 pl-6">
                <Select value={f.type} onValueChange={(v) => updateCustomField(i, { type: v as CustomFieldType })}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(TYPE_LABELS) as CustomFieldType[]).map(t => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm"><Switch checked={f.required} onCheckedChange={(v) => updateCustomField(i, { required: v })} /> Obligatoire</label>
              </div>
              {f.type === "select" && (
                <div className="pl-6">
                  <Label className="text-xs">Options (une par ligne)</Label>
                  <Textarea className="mt-1" rows={3} placeholder={"Gare routière\nAéroport\nCentre-ville"} value={(f.options ?? []).join("\n")} onChange={(e) => updateCustomField(i, { options: e.target.value.split("\n") })} />
                </div>
              )}
            </div>
          ))}
          <Button variant="outline" onClick={addCustomField} className="gap-1"><Plus className="h-4 w-4" /> Ajouter un champ</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end sticky bottom-4">
        <Button onClick={save} disabled={saving} className="gap-1 shadow-lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer les modifications"}
        </Button>
      </div>
    </div>
  );
}
