import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useMe } from "@/hooks/useMe";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Onboarding from "@/pages/onboarding";
import PublicBooking from "@/pages/public-booking";
import BookingSettings from "@/pages/booking-settings";

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
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

function FullSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppRoutes() {
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
        <Route path="/booking" component={BookingSettings} />
        <Route path="/profile" component={Profil} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Gate() {
  const { session, loading } = useAuth();
  const me = useMe(!!session);
  const [location] = useLocation();

  if (loading) return <FullSpinner />;

  // Unauthenticated: public marketing + auth pages.
  if (!session) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/" component={Landing} />
        <Route><Redirect to="/" /></Route>
      </Switch>
    );
  }

  // Authenticated: resolve company context.
  if (me.isLoading) return <FullSpinner />;
  if (me.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <p className="text-sm text-muted-foreground">Impossible de joindre le serveur. Vérifiez que l'API est démarrée.</p>
          <Button onClick={() => me.refetch()}>Réessayer</Button>
        </div>
      </div>
    );
  }
  if (!me.data?.onboarded) return <Onboarding />;

  // An authenticated, onboarded user has no business on the public auth pages.
  if (location === "/login" || location === "/signup") return <Redirect to="/" />;

  return <AppRoutes />;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <ErrorBoundary>
                <Switch>
                  {/* Public, auth-free reservation page (per-company link). */}
                  <Route path="/book/:slug" component={PublicBooking} />
                  {/* Everything else goes through the auth/tenant gate. */}
                  <Route><Gate /></Route>
                </Switch>
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
