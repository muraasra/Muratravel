import { useGetCompany } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CompanyDetail() {
  const [, params] = useRoute("/companies/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: company, isLoading } = useGetCompany(id, {
    query: { enabled: !!id }
  });

  if (isLoading) return <div>Loading...</div>;
  if (!company) return <div>Company not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
        <Badge variant={company.status === "active" ? "default" : "secondary"}>{company.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><span className="font-semibold">Country:</span> {company.country}</div>
            <div><span className="font-semibold">Currency:</span> {company.currency}</div>
            {company.email && <div><span className="font-semibold">Email:</span> {company.email}</div>}
            {company.phone && <div><span className="font-semibold">Phone:</span> {company.phone}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}