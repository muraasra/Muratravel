import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function PageIntrouvable() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-6" />
      <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
      <p className="text-muted-foreground text-lg mb-6">Page introuvable</p>
      <Link href="/">
        <Button>Retour au tableau de bord</Button>
      </Link>
    </div>
  );
}
