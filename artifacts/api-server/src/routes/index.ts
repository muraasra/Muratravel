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

export default router;
