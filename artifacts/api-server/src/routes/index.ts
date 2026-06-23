import { Router, type IRouter } from "express";
import { requireAuth, requireCompany } from "../middlewares/auth";
import healthRouter from "./health";
import publicBookingRouter from "./public_booking";
import meRouter from "./me";
import bookingConfigRouter from "./booking_config";
import companiesRouter from "./companies";
import usersRouter from "./users";
import agenciesRouter from "./agencies";
import destinationsRouter from "./destinations";
import vehiclesRouter from "./vehicles";
import tripsRouter from "./trips";
import reservationsRouter from "./reservations";
import baggageRouter from "./baggage";
import paymentsRouter from "./payments";
import reportsRouter from "./reports";
import incidentsRouter from "./incidents";
import financeRouter from "./finance";
import auditRouter from "./audit";
import notificationsRouter from "./notifications_route";
import subscriptionsRouter from "./subscriptions_route";

const router: IRouter = Router();

// 1) Public — no auth. Health + public booking pages.
router.use(healthRouter);
router.use(publicBookingRouter);

// 2) Authenticated but company-agnostic (profile + onboarding).
router.use(meRouter);

// 3) Tenant boundary: everything below requires a valid session AND a company.
//    Every query in these routers is scoped to req.companyId.
const tenant = Router();
tenant.use(requireAuth, requireCompany);
// Force the tenant's companyId onto every write body. This both satisfies the
// shared zod schemas (which require companyId) and guarantees a caller can never
// create rows for another company by spoofing the field.
tenant.use((req, _res, next) => {
  if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
    (req.body as Record<string, unknown>).companyId = (req as { companyId?: number }).companyId;
  }
  next();
});
tenant.use(companiesRouter);
tenant.use(usersRouter);
tenant.use(agenciesRouter);
tenant.use(destinationsRouter);
tenant.use(vehiclesRouter);
tenant.use(tripsRouter);
tenant.use(reservationsRouter);
tenant.use(baggageRouter);
tenant.use(paymentsRouter);
tenant.use(reportsRouter);
tenant.use(incidentsRouter);
tenant.use(financeRouter);
tenant.use(auditRouter);
tenant.use(notificationsRouter);
tenant.use(subscriptionsRouter);
tenant.use(bookingConfigRouter);

router.use(tenant);

export default router;
