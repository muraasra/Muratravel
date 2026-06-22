import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Login from "@/pages/login";

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
import Baggage from "@/pages/baggage";
import Finance from "@/pages/finance";
import Incidents from "@/pages/incidents";
import NotificationsPage from "@/pages/notifications-page";
import Audit from "@/pages/audit";
import Subscriptions from "@/pages/subscriptions";
import Profil from "@/pages/profile";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

function ProtectedRouter() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

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
        <Route path="/finance" component={Finance} />
        <Route path="/users" component={Users} />
        <Route path="/reports" component={Reports} />
        <Route path="/baggage" component={Baggage} />
        <Route path="/incidents" component={Incidents} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/audit" component={Audit} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/profile" component={Profil} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <ErrorBoundary>
                <ProtectedRouter />
              </ErrorBoundary>
            </WouterRouter>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
