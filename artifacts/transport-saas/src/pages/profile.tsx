import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import {
  User,
  Shield,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Smartphone,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface MFAFactor {
  id: string;
  status: "verified" | "unverified";
  factor_type: string;
  friendly_name?: string | null;
  created_at: string;
  updated_at: string;
}

export default function Profil() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  // ─── Onglet actif ────────────────────────────────────────────────────────────
  const [onglet, setOnglet] = useState<"profil" | "securite" | "2fa">("profil");

  // ─── Modifier mot de passe ───────────────────────────────────────────────────
  const [motDePasse, setMotDePasse] = useState({ actuel: "", nouveau: "", confirmation: "" });
  const [showMdp, setShowMdp] = useState(false);
  const [loadingMdp, setLoadingMdp] = useState(false);

  // ─── 2FA TOTP ────────────────────────────────────────────────────────────────
  const [facteurs2FA, setFacteurs2FA] = useState<MFAFactor[]>([]);
  const [enrollData, setEnrollData] = useState<{ id: string; totp_uri: string; secret: string } | null>(null);
  const [codeVerif, setCodeVerif] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [loading2FA, setLoading2FA] = useState(false);
  const [etape2FA, setEtape2FA] = useState<"idle" | "scanning" | "verifying" | "done">("idle");

  useEffect(() => {
    chargerFacteurs();
  }, []);

  async function chargerFacteurs() {
    const { data } = await supabase.auth.mfa.listFactors();
    if (data) setFacteurs2FA(data.totp as MFAFactor[]);
  }

  const aDejaTotp = facteurs2FA.some((f) => f.status === "verified" && f.factor_type === "totp");
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Utilisateur";
  const avatarUrl = user?.user_metadata?.avatar_url;

  async function changerMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    if (!motDePasse.nouveau || motDePasse.nouveau !== motDePasse.confirmation) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (motDePasse.nouveau.length < 8) {
      toast({ title: "Le mot de passe doit faire au moins 8 caractères", variant: "destructive" });
      return;
    }
    setLoadingMdp(true);
    const { error } = await supabase.auth.updateUser({ password: motDePasse.nouveau });
    setLoadingMdp(false);
    if (error) {
      toast({ title: "Erreur : " + error.message, variant: "destructive" });
    } else {
      toast({ title: "Mot de passe mis à jour avec succès" });
      setMotDePasse({ actuel: "", nouveau: "", confirmation: "" });
    }
  }

  async function commencerEnrollment() {
    setLoading2FA(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Application Auth" });
    setLoading2FA(false);
    if (error || !data) {
      toast({ title: "Erreur lors de l'activation 2FA : " + error?.message, variant: "destructive" });
      return;
    }
    setEnrollData({
      id: data.id,
      totp_uri: data.totp.uri,
      secret: data.totp.secret,
    });
    const { data: challenge, error: errChallenge } = await supabase.auth.mfa.challenge({ factorId: data.id });
    if (errChallenge || !challenge) {
      toast({ title: "Erreur : " + errChallenge?.message, variant: "destructive" });
      return;
    }
    setChallengeId(challenge.id);
    setEtape2FA("scanning");
  }

  async function verifier2FA(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollData || !challengeId) return;
    setLoading2FA(true);
    const { error } = await supabase.auth.mfa.verify({
      factorId: enrollData.id,
      challengeId,
      code: codeVerif.replace(/\s/g, ""),
    });
    setLoading2FA(false);
    if (error) {
      toast({ title: "Code invalide. Réessayez.", variant: "destructive" });
      return;
    }
    toast({ title: "Authentification à 2 facteurs activée !" });
    setEtape2FA("done");
    setEnrollData(null);
    setCodeVerif("");
    chargerFacteurs();
  }

  async function desactiver2FA(factorId: string) {
    setLoading2FA(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setLoading2FA(false);
    if (error) {
      toast({ title: "Erreur : " + error.message, variant: "destructive" });
    } else {
      toast({ title: "2FA désactivée" });
      chargerFacteurs();
    }
  }

  const tabs = [
    { id: "profil" as const, label: "Profil", icon: User },
    { id: "securite" as const, label: "Sécurité", icon: KeyRound },
    { id: "2fa" as const, label: "2FA", icon: Shield },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon compte</h1>
        <p className="text-sm text-muted-foreground">Gérez votre profil et la sécurité de votre compte</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setOnglet(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                onglet === t.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Onglet Profil ────────────────────────────────────────────────── */}
      {onglet === "profil" && (
        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
            <CardDescription>Vos informations de connexion Supabase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-16 h-16 rounded-full border-2 border-primary/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-semibold text-lg">{displayName}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {user?.app_metadata?.provider === "google" ? "Compte Google" : "Email/Mot de passe"}
                  </Badge>
                  {aDejaTotp && (
                    <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                      <ShieldCheck className="h-3 w-3 mr-1" /> 2FA activée
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs mb-1">ID Supabase</div>
                <div className="font-mono text-xs break-all">{user?.id}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Dernière connexion</div>
                <div>
                  {user?.last_sign_in_at
                    ? new Intl.DateTimeFormat("fr-FR", {
                        day: "2-digit", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      }).format(new Date(user.last_sign_in_at))
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Email vérifié</div>
                <div className="flex items-center gap-1">
                  {user?.email_confirmed_at ? (
                    <><CheckCircle2 className="h-4 w-4 text-green-500" /> Oui</>
                  ) : (
                    <><AlertTriangle className="h-4 w-4 text-orange-500" /> Non vérifié</>
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Compte créé le</div>
                <div>
                  {user?.created_at
                    ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(user.created_at))
                    : "—"}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Button variant="destructive" onClick={signOut} size="sm">
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Onglet Sécurité ──────────────────────────────────────────────── */}
      {onglet === "securite" && (
        <Card>
          <CardHeader>
            <CardTitle>Changer le mot de passe</CardTitle>
            <CardDescription>
              {user?.app_metadata?.provider === "google"
                ? "Votre compte utilise la connexion Google — vous pouvez définir un mot de passe supplémentaire ici."
                : "Mettez à jour votre mot de passe de connexion."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={changerMotDePasse} className="space-y-4">
              <div>
                <Label>Nouveau mot de passe</Label>
                <div className="relative mt-1">
                  <Input
                    type={showMdp ? "text" : "password"}
                    placeholder="Minimum 8 caractères"
                    value={motDePasse.nouveau}
                    onChange={(e) => setMotDePasse((f) => ({ ...f, nouveau: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowMdp((v) => !v)}
                  >
                    {showMdp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>Confirmer le mot de passe</Label>
                <Input
                  className="mt-1"
                  type={showMdp ? "text" : "password"}
                  placeholder="Répétez le mot de passe"
                  value={motDePasse.confirmation}
                  onChange={(e) => setMotDePasse((f) => ({ ...f, confirmation: e.target.value }))}
                />
              </div>
              {motDePasse.nouveau && motDePasse.confirmation && motDePasse.nouveau !== motDePasse.confirmation && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> Les mots de passe ne correspondent pas
                </p>
              )}
              <Button type="submit" disabled={loadingMdp || !motDePasse.nouveau || !motDePasse.confirmation}>
                {loadingMdp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
                Mettre à jour
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Onglet 2FA ───────────────────────────────────────────────────── */}
      {onglet === "2fa" && (
        <div className="space-y-4">
          {/* Statut 2FA */}
          <Card className={aDejaTotp ? "border-green-200 bg-green-50/30" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {aDejaTotp ? (
                  <><ShieldCheck className="h-5 w-5 text-green-600" /> 2FA est activée</>
                ) : (
                  <><ShieldOff className="h-5 w-5 text-muted-foreground" /> 2FA non configurée</>
                )}
              </CardTitle>
              <CardDescription>
                {aDejaTotp
                  ? "Votre compte est protégé par l'authentification à deux facteurs."
                  : "Sécurisez votre compte avec une application d'authentification (Google Authenticator, Authy…)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aDejaTotp ? (
                <div className="space-y-3">
                  {facteurs2FA
                    .filter((f) => f.status === "verified")
                    .map((f) => (
                      <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium text-sm">{f.friendly_name ?? "Application Auth"}</div>
                            <div className="text-xs text-muted-foreground">
                              Configurée le{" "}
                              {new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(f.created_at))}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                          onClick={() => desactiver2FA(f.id)}
                          disabled={loading2FA}
                        >
                          {loading2FA ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4 mr-1" />}
                          Désactiver
                        </Button>
                      </div>
                    ))}
                </div>
              ) : etape2FA === "idle" ? (
                <Button onClick={commencerEnrollment} disabled={loading2FA}>
                  {loading2FA ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Activer l'authentification à 2 facteurs
                </Button>
              ) : etape2FA === "scanning" && enrollData ? (
                <div className="space-y-6">
                  {/* Étape 1 : scanner le QR */}
                  <div className="flex gap-6 items-start">
                    <div className="p-3 bg-white border rounded-xl shadow-sm">
                      <QRCodeSVG value={enrollData.totp_uri} size={140} level="M" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <div>
                        <p className="font-medium text-sm mb-1">Étape 1 — Scanner le QR</p>
                        <p className="text-sm text-muted-foreground">
                          Ouvrez votre application d'authentification (Google Authenticator, Authy, Microsoft Authenticator…) et scannez ce code QR.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Ou entrez ce code manuellement :</p>
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono tracking-wider break-all">
                          {enrollData.secret}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Étape 2 : entrer le code */}
                  <form onSubmit={verifier2FA} className="space-y-3">
                    <div>
                      <Label>Étape 2 — Entrez le code à 6 chiffres de votre application</Label>
                      <Input
                        className="mt-1 font-mono tracking-[0.4em] text-center text-lg max-w-xs"
                        placeholder="000 000"
                        maxLength={7}
                        value={codeVerif}
                        onChange={(e) => setCodeVerif(e.target.value.replace(/[^0-9\s]/g, ""))}
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading2FA || codeVerif.replace(/\s/g, "").length < 6}>
                        {loading2FA ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                        Vérifier et activer
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => { setEtape2FA("idle"); setEnrollData(null); }}>
                        Annuler
                      </Button>
                    </div>
                  </form>
                </div>
              ) : etape2FA === "done" ? (
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="font-medium">2FA activée avec succès !</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Conseils sécurité */}
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wide text-xs">Conseils sécurité</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" /> Activez la 2FA pour protéger votre compte</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" /> Utilisez un mot de passe fort et unique</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" /> Ne partagez jamais vos codes de connexion</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" /> Déconnectez-vous sur les appareils partagés</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
