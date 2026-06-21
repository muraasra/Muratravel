import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Dashboard from "@/pages/dashboard";
import Companies from "@/pages/companies";
import CompanyDetail from "@/pages/company-detail";
import Agencies from "@/pages/agencies";
import Destinations from "@/pages/destinations";
import Vehicles from "@/pages/vehicles";
import Trips from "@/pages/trips";
import TripDetail from "@/pages/trip-detail";
import Reservations from "@/pages/reservations";
import ReservationDetail from "@/pages/reservation-detail";
import Boarding from "@/pages/boarding";
import Payments from "@/pages/payments";
import Users from "@/pages/users";
import Reports from "@/pages/reports";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/companies" component={Companies} />
        <Route path="/companies/:id" component={CompanyDetail} />
        <Route path="/agencies" component={Agencies} />
        <Route path="/destinations" component={Destinations} />
        <Route path="/vehicles" component={Vehicles} />
        <Route path="/trips" component={Trips} />
        <Route path="/trips/:id" component={TripDetail} />
        <Route path="/reservations" component={Reservations} />
        <Route path="/reservations/:id" component={ReservationDetail} />
        <Route path="/boarding" component={Boarding} />
        <Route path="/payments" component={Payments} />
        <Route path="/users" component={Users} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
