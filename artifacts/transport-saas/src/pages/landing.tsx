import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Bus, Ticket, QrCode, ShieldCheck, BarChart3, Users, Wallet, MapPin,
  Check, ArrowRight, Menu, X, Smartphone, Building2,
} from "lucide-react";
import { useState } from "react";

const features = [
  { icon: Ticket, titre: "Réservations & billetterie", desc: "Vendez des billets en quelques secondes avec QR Code et impression thermique 80mm." },
  { icon: QrCode, titre: "Embarquement par QR", desc: "Contrôlez les passagers à l'embarquement en scannant le billet. Plus de fraude." },
  { icon: Bus, titre: "Gestion de flotte", desc: "Véhicules, assurances, maintenance et chauffeurs centralisés." },
  { icon: MapPin, titre: "Voyages & destinations", desc: "Planifiez vos itinéraires, tarifs et horaires. Manifeste automatique par départ." },
  { icon: Wallet, titre: "Caisse & finances", desc: "Encaissements, dépenses, journal de caisse et rapports de revenus en temps réel." },
  { icon: BarChart3, titre: "Tableau de bord", desc: "Revenus, taux de remplissage et top destinations, mis à jour en direct." },
];

const plans = [
  { nom: "Starter", prix: "Gratuit", periode: "14 j d'essai", points: ["1 agence", "5 utilisateurs", "Billetterie + QR", "Tableau de bord"], populaire: false },
  { nom: "Business", prix: "25 000", periode: "FCFA / mois", points: ["5 agences", "25 utilisateurs", "Finances & rapports", "Bagages & incidents", "Support prioritaire"], populaire: true },
  { nom: "Enterprise", prix: "Sur devis", periode: "", points: ["Agences illimitées", "Utilisateurs illimités", "API & intégrations", "Accompagnement dédié"], populaire: false },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Bus className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">MuraTravel</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Tarifs</a>
            <a href="#mobile" className="hover:text-foreground transition-colors">Mobile</a>
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" size="sm">Se connecter</Button></Link>
            <Link href="/signup"><Button size="sm" className="gap-1">Créer ma compagnie <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t bg-background px-4 py-3 space-y-2">
            <a href="#features" onClick={() => setMenuOpen(false)} className="block py-1.5 text-sm">Fonctionnalités</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="block py-1.5 text-sm">Tarifs</a>
            <a href="#mobile" onClick={() => setMenuOpen(false)} className="block py-1.5 text-sm">Mobile</a>
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Se connecter</Button></Link>
              <Link href="/signup" className="flex-1"><Button size="sm" className="w-full">Commencer</Button></Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Données 100% isolées par compagnie
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            Le logiciel de gestion<br className="hidden md:block" /> pour le <span className="text-primary">transport de voyageurs</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Billetterie, embarquement par QR Code, flotte, caisse et rapports — tout pour gérer votre
            compagnie de bus, minibus ou ferry. Pensé pour l'Afrique de l'Ouest.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup"><Button size="lg" className="gap-2 w-full sm:w-auto">Créer ma compagnie gratuitement <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link href="/login"><Button size="lg" variant="outline" className="w-full sm:w-auto">J'ai déjà un compte</Button></Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">14 jours d'essai · Sans carte bancaire · En français</p>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[["100%", "Données isolées"], ["80mm", "Billets thermiques"], ["2FA", "Sécurité des comptes"], ["XOF", "FCFA natif"]].map(([k, v]) => (
            <div key={v}>
              <div className="text-2xl md:text-3xl font-bold text-primary">{k}</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Tout votre métier, au même endroit</h2>
          <p className="mt-3 text-muted-foreground">De la vente du billet au rapport de fin de journée.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.titre} className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{f.titre}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy / segmentation highlight */}
      <section className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs mb-4">
              <ShieldCheck className="h-3.5 w-3.5" /> Confidentialité par conception
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Chaque compagnie, son espace étanche</h2>
            <p className="mt-4 text-sidebar-foreground/70 leading-relaxed">
              Vos voyages, passagers, paiements et employés sont strictement isolés. Aucune autre
              compagnie ne peut voir vos données — la séparation est imposée côté serveur sur chaque requête.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {["Isolation stricte par compagnie", "Authentification Supabase + 2FA", "Rôles & permissions (admin, agent, chauffeur…)", "Journal d'audit de toutes les actions"].map(t => (
                <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[Building2, Users, Wallet, BarChart3].map((Icon, i) => (
              <div key={i} className="rounded-xl bg-sidebar-accent/40 border border-sidebar-border p-6 flex items-center justify-center aspect-square">
                <Icon className="h-10 w-10 text-primary" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile */}
      <section id="mobile" className="mx-auto max-w-6xl px-4 py-20 grid md:grid-cols-2 gap-10 items-center">
        <div className="order-2 md:order-1 flex justify-center">
          <div className="w-56 h-[420px] rounded-[2.5rem] border-8 border-foreground/10 bg-card shadow-xl p-3 flex flex-col">
            <div className="h-1.5 w-16 bg-muted rounded-full mx-auto mb-3" />
            <div className="flex-1 rounded-2xl bg-primary/5 p-3 space-y-2 overflow-hidden">
              <div className="rounded-lg bg-primary p-3 text-primary-foreground text-xs font-semibold flex items-center gap-2"><Ticket className="h-4 w-4" /> Nouveau billet</div>
              {[0,1,2].map(i => <div key={i} className="rounded-lg bg-card border p-3"><div className="h-2 w-20 bg-muted rounded mb-2" /><div className="h-2 w-12 bg-muted rounded" /></div>)}
            </div>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary mb-4">
            <Smartphone className="h-3.5 w-3.5" /> 100% responsive
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Gérez depuis votre téléphone</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            L'application s'adapte au mobile, à la tablette et au PC. Vendez un billet au guichet,
            embarquez les passagers sur le quai, suivez la caisse — directement depuis votre smartphone.
          </p>
          <div className="mt-6"><Link href="/signup"><Button className="gap-2">Essayer maintenant <ArrowRight className="h-4 w-4" /></Button></Link></div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/30 border-y">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Des tarifs simples</h2>
            <p className="mt-3 text-muted-foreground">Commencez gratuitement, évoluez quand vous grandissez.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((p) => (
              <div key={p.nom} className={`rounded-2xl border bg-card p-6 flex flex-col ${p.populaire ? "ring-2 ring-primary shadow-lg md:-translate-y-2" : ""}`}>
                {p.populaire && <div className="self-start rounded-full bg-primary px-3 py-0.5 text-xs text-primary-foreground mb-3">Le plus choisi</div>}
                <h3 className="font-semibold text-lg">{p.nom}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-bold">{p.prix}</span>
                  {p.periode && <span className="text-sm text-muted-foreground mb-1">{p.periode}</span>}
                </div>
                <ul className="mt-6 space-y-2.5 text-sm flex-1">
                  {p.points.map(pt => <li key={pt} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" /> {pt}</li>)}
                </ul>
                <Link href="/signup" className="mt-6"><Button variant={p.populaire ? "default" : "outline"} className="w-full">Commencer</Button></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Prêt à digitaliser votre compagnie ?</h2>
        <p className="mt-4 text-muted-foreground">Créez votre espace en 2 minutes et vendez votre premier billet aujourd'hui.</p>
        <div className="mt-8"><Link href="/signup"><Button size="lg" className="gap-2">Créer ma compagnie gratuitement <ArrowRight className="h-4 w-4" /></Button></Link></div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center"><Bus className="w-4 h-4 text-primary-foreground" /></div>
            <span className="font-semibold text-foreground">MuraTravel</span>
          </div>
          <p>© {new Date().getFullYear()} MuraTravel — Simplifier le transport en Afrique de l'Ouest.</p>
        </div>
      </footer>
    </div>
  );
}
