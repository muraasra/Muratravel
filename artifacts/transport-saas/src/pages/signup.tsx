import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bus, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function Signup() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    setLoading(true);
    const { error, needsConfirmation } = await signUpWithEmail(email, password, fullName);
    setLoading(false);
    if (error) { setError(error); return; }
    if (needsConfirmation) setConfirmSent(true);
    // If a session is returned immediately, the auth listener routes to onboarding.
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signInWithGoogle();
  }

  if (confirmSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center shadow-xl">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Vérifiez votre email</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Un lien de confirmation a été envoyé à <span className="font-medium text-foreground">{email}</span>.
                Cliquez dessus pour activer votre compte.
              </p>
            </div>
            <Link href="/login"><Button variant="outline" className="w-full">Aller à la connexion</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Bus className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Créer ma compagnie</h1>
            <p className="text-sm text-muted-foreground">Démarrez votre essai gratuit de 14 jours</p>
          </div>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Inscription</CardTitle>
            <CardDescription>En tant qu'administrateur de votre compagnie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full gap-2 h-10" onClick={handleGoogle} disabled={googleLoading}>
              {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continuer avec Google
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" /><span className="text-xs text-muted-foreground">ou</span><Separator className="flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label className="text-xs">Nom complet</Label>
                <Input className="mt-1 h-9" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jean Mbarga" required />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input className="mt-1 h-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@compagnie.com" required />
              </div>
              <div>
                <Label className="text-xs">Mot de passe</Label>
                <Input className="mt-1 h-9" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Au moins 6 caractères" required />
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full h-9" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer mon compte"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Accueil</Link>
          <span>·</span>
          <Link href="/login" className="hover:text-foreground">Déjà un compte ? Se connecter</Link>
        </div>
      </div>
    </div>
  );
}
