import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, paymentsTable, reservationsTable } from "@workspace/db";
import {
  CreatePaymentBody,
  UpdatePaymentBody,
  GetPaymentParams,
  UpdatePaymentParams,
  ListPaymentsQueryParams,
  ListPaymentsResponse,
  GetPaymentResponse,
  UpdatePaymentResponse,
} from "@workspace/api-zod";
import { tenantCompanyId } from "../middlewares/auth";

const router = Router();

function serializePayment(p: typeof paymentsTable.$inferSelect) {
  return { ...p, amount: parseFloat(p.amount), createdAt: p.createdAt.toISOString() };
}

router.get("/payments", async (req, res): Promise<void> => {
  const qp = ListPaymentsQueryParams.safeParse(req.query);
  const conditions = [eq(paymentsTable.companyId, tenantCompanyId(req))];
  if (qp.success && qp.data.reservationId != null) conditions.push(eq(paymentsTable.reservationId, qp.data.reservationId));
  const rows = await db.select().from(paymentsTable).where(and(...conditions)).orderBy(paymentsTable.createdAt);
  res.json(ListPaymentsResponse.parse(rows.map(serializePayment)));
});

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const companyId = tenantCompanyId(req);
  // The reservation must belong to the caller's company.
  const [reservation] = await db.select().from(reservationsTable).where(and(eq(reservationsTable.id, parsed.data.reservationId), eq(reservationsTable.companyId, companyId)));
  if (!reservation) { res.status(404).json({ error: "Reservation not found" }); return; }
  const [payment] = await db.insert(paymentsTable).values({
    ...parsed.data,
    companyId,
    amount: String(parsed.data.amount),
    status: "completed",
  }).returning();
  await db.update(reservationsTable).set({ status: "paid" }).where(eq(reservationsTable.id, parsed.data.reservationId));
  res.status(201).json(GetPaymentResponse.parse(serializePayment(payment)));
});

router.get("/payments/:id", async (req, res): Promise<void> => {
  const params = GetPaymentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [payment] = await db.select().from(paymentsTable).where(and(eq(paymentsTable.id, params.data.id), eq(paymentsTable.companyId, tenantCompanyId(req))));
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
  res.json(GetPaymentResponse.parse(serializePayment(payment)));
});

router.patch("/payments/:id", async (req, res): Promise<void> => {
  const params = UpdatePaymentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdatePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [payment] = await db.update(paymentsTable).set(parsed.data)
    .where(and(eq(paymentsTable.id, params.data.id), eq(paymentsTable.companyId, tenantCompanyId(req)))).returning();
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
  res.json(UpdatePaymentResponse.parse(serializePayment(payment)));
});

export default router;
