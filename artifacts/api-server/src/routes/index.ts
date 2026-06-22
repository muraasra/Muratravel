import { Router, type IRouter } from "express";
import healthRouter from "./health";
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

router.use(healthRouter);
router.use(companiesRouter);
router.use(usersRouter);
router.use(agenciesRouter);
router.use(destinationsRouter);
router.use(vehiclesRouter);
router.use(tripsRouter);
router.use(reservationsRouter);
router.use(baggageRouter);
router.use(paymentsRouter);
router.use(reportsRouter);
router.use(incidentsRouter);
router.use(financeRouter);
router.use(auditRouter);
router.use(notificationsRouter);
router.use(subscriptionsRouter);

export default router;
