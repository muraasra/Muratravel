import { useGetCompany } from "@workspace/api-client-react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Mail, Phone, MapPin, Globe } from "lucide-react";

export default function DetailCompagnie() {
  const [, params] = useRoute("/companies/:id");
  const [, navigate] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: company, isLoading } = useGetCompany(id, { query: { enabled: !!id, queryKey: [`/api/companies/${id}`] } });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-60 bg-muted rounded-lg" />
      </div>
    );
  }
  if (!company) return <div className="text-muted-foreground">Compagnie introuvable.</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/companies")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-muted-foreground text-sm">Fiche compagnie</p>
        </div>
        <Badge className="ml-2" variant={company.status === "active" ? "default" : "secondary"}>
          {company.status === "active" ? "Actif" : "Inactif"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Pays :</span>
              <span className="font-medium">{company.country}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground ml-6">Devise :</span>
              <span className="font-medium font-mono">{company.currency}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground ml-6">Langue :</span>
              <span className="font-medium">{company.language === "fr" ? "Français" : company.language}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {company.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{company.email}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{company.phone}</span>
              </div>
            )}
            {company.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{company.address}</span>
              </div>
            )}
            {!company.email && !company.phone && !company.address && (
              <p className="text-muted-foreground text-sm">Aucun contact renseigné</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
