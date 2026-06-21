import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetRevenueReport, useGetOccupancyReport, useGetTopDestinations } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { formatFCFA } from "@/lib/fcfa";

const PERIODES = [
  { label: "Quotidien", value: "daily" },
  { label: "Hebdomadaire", value: "weekly" },
  { label: "Mensuel", value: "monthly" },
];

const COULEURS = [
  "hsl(var(--primary))",
  "hsl(210 80% 56%)",
  "hsl(160 60% 45%)",
  "hsl(45 90% 55%)",
  "hsl(280 70% 60%)",
];

export default function Rapports() {
  const [periode, setPeriode] = useState<"daily" | "weekly" | "monthly">("monthly");
  const { data: revenue } = useGetRevenueReport({ period: periode });
  const { data: occupancy } = useGetOccupancyReport();
  const { data: topDest } = useGetTopDestinations({ limit: 6 });

  const totalRevenu = revenue?.reduce((s, r) => s + (r.revenue ?? 0), 0) ?? 0;
  const totalReservations = revenue?.reduce((s, r) => s + (r.reservationCount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapports</h1>
          <p className="text-muted-foreground text-sm mt-1">Analyses financières et opérationnelles</p>
        </div>
        <div className="flex gap-2">
          {PERIODES.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={periode === p.value ? "default" : "outline"}
              onClick={() => setPeriode(p.value as "daily" | "weekly" | "monthly")}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Revenus totaux (période)</p>
            <p className="text-3xl font-bold mt-1">{formatFCFA(totalRevenu)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total réservations (période)</p>
            <p className="text-3xl font-bold mt-1">{totalReservations.toLocaleString("fr-FR")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Évolution des revenus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue || []} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip formatter={(v: number) => [formatFCFA(v), "Revenus"]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Taux d'occupation par route</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancy || []} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="route" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} angle={-30} textAnchor="end" interval={0} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <RechartsTooltip formatter={(v: number) => [`${v}%`, "Taux d'occupation"]} />
                  <Bar dataKey="occupancyRate" radius={[4, 4, 0, 0]}>
                    {(occupancy || []).map((_, i) => (
                      <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDest || []} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="route" type="category" stroke="hsl(var(--foreground))" fontSize={11} tickLine={false} axisLine={false} width={130} />
                  <RechartsTooltip formatter={(v: number) => [v, "Voyages"]} />
                  <Bar dataKey="tripCount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
