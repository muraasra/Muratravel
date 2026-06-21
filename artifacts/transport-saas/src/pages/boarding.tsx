import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Boarding() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Boarding Scanner</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Select Trip to Board</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            Select a trip from the schedule to start boarding passengers.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}