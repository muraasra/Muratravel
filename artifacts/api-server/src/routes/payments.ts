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

const router = Router();

function serializePayment(p: typeof paymentsTable.$inferSelect) {
  return { ...p, amount: parseFloat(p.amount), createdAt: p.createdAt.toISOString() };
}

router.get("/payments", async (req, res): Promise<void> => {
  const qp = ListPaymentsQueryParams.safeParse(req.query);
  const conditions = [];
  if (qp.success) {
    if (qp.data.reservationId != null) conditions.push(eq(paymentsTable.reservationId, qp.data.reservationId));
    if (qp.data.companyId != null) {
      // Filter by company via reservations -> trips -> companyId
    }
  }
  const rows = conditions.length
    ? await db.select().from(paymentsTable).where(and(...conditions)).orderBy(paymentsTable.createdAt)
    : await db.select().from(paymentsTable).orderBy(paymentsTable.createdAt);
  res.json(ListPaymentsResponse.parse(rows.map(serializePayment)));
});

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [payment] = await db.insert(paymentsTable).values({
    ...parsed.data,
    amount: String(parsed.data.amount),
    status: "completed",
  }).returning();
  // Update reservation to paid if payment completed
  await db.update(reservationsTable).set({ status: "paid" }).where(eq(reservationsTable.id, parsed.data.reservationId));
  res.status(201).json(GetPaymentResponse.parse(serializePayment(payment)));
});

router.get("/payments/:id", async (req, res): Promise<void> => {
  const params = GetPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, params.data.id));
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  res.json(GetPaymentResponse.parse(serializePayment(payment)));
});

router.patch("/payments/:id", async (req, res): Promise<void> => {
  const params = UpdatePaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [payment] = await db.update(paymentsTable).set(parsed.data).where(eq(paymentsTable.id, params.data.id)).returning();
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  res.json(UpdatePaymentResponse.parse(serializePayment(payment)));
});

export default router;
