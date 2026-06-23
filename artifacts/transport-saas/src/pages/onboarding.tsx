import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bus, Loader2, LogOut, Building2 } from "lucide-react";

const PAYS = ["Cameroun", "Sénégal", "Côte d'Ivoire", "Mali", "Burkina Faso", "Bénin", "Togo", "Niger", "Guinée", "Gabon", "Congo", "Tchad", "Autre"];

export default function Onboarding() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("Cameroun");
  const [currency, setCurrency] = useState("XOF");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/onboarding", {
        method: "POST",
        body: JSON.stringify({ companyName, country, currency, phone: phone || undefined }),
      });
      // Land on the dashboard, then refresh the profile so the app shell loads.
      setLocation("/");
      await qc.invalidateQueries({ queryKey: ["/api/me"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Bus className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Bienvenue {user?.user_metadata?.full_name?.split(" ")[0] ?? ""} 👋</h1>
            <p className="text-sm text-muted-foreground">Créons votre compagnie pour commencer.</p>
          </div>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Votre compagnie</CardTitle>
            <CardDescription>Vous en serez l'administrateur. Vous pourrez ajouter agences et employés ensuite.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs">Nom de la compagnie</Label>
                <Input className="mt-1" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex. Trans-Express Voyages" required minLength={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Pays</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Devise</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XOF">FCFA (XOF)</SelectItem>
                      <SelectItem value="XAF">FCFA (XAF)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="USD">Dollar (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Téléphone (optionnel)</Label>
                <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6 00 00 00 00" />
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer ma compagnie & commencer"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <button onClick={signOut} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <LogOut className="h-3 w-3" /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
