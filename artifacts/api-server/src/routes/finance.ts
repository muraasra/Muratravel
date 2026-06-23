import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import { z } from "zod";
import { randomBytes } from "crypto";
import { tenantCompanyId } from "../middlewares/auth";

const router = Router();

const CreateTransactionBody = z.object({
  type: z.enum(["encaissement", "depense", "remboursement"]),
  montant: z.number().positive(),
  description: z.string().min(1),
  methode: z.enum(["cash", "card", "mobile_money", "bank_transfer"]).default("cash"),
  agencyId: z.number().int().optional(),
  reservationId: z.number().int().optional(),
  tripId: z.number().int().optional(),
  notes: z.string().optional(),
});

router.get("/finance/transactions", async (req, res): Promise<void> => {
  const companyId = tenantCompanyId(req);
  const rows = await db.select().from(transactionsTable).where(eq(transactionsTable.companyId, companyId)).orderBy(transactionsTable.createdAt);
  res.json(rows.map(r => ({ ...r, montant: parseFloat(r.montant), createdAt: r.createdAt.toISOString() })));
});

router.post("/finance/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const prefix = parsed.data.type === "encaissement" ? "ENC" : parsed.data.type === "depense" ? "DEP" : "REM";
  const reference = `${prefix}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const [transaction] = await db.insert(transactionsTable).values({
    ...parsed.data,
    companyId: tenantCompanyId(req),
    montant: String(parsed.data.montant),
    reference,
  }).returning();
  res.status(201).json({ ...transaction, montant: parseFloat(transaction.montant), createdAt: transaction.createdAt.toISOString() });
});

router.get("/finance/summary", async (req, res): Promise<void> => {
  const cond = eq(transactionsTable.companyId, tenantCompanyId(req));
  const encaissements = await db.select({ total: sql<number>`COALESCE(SUM(montant::numeric), 0)` })
    .from(transactionsTable).where(and(cond, eq(transactionsTable.type, "encaissement")));
  const depenses = await db.select({ total: sql<number>`COALESCE(SUM(montant::numeric), 0)` })
    .from(transactionsTable).where(and(cond, eq(transactionsTable.type, "depense")));
  const remboursements = await db.select({ total: sql<number>`COALESCE(SUM(montant::numeric), 0)` })
    .from(transactionsTable).where(and(cond, eq(transactionsTable.type, "remboursement")));

  const enc = Number(encaissements[0]?.total ?? 0);
  const dep = Number(depenses[0]?.total ?? 0);
  const rem = Number(remboursements[0]?.total ?? 0);
  res.json({ encaissements: enc, depenses: dep, remboursements: rem, solde: enc - dep - rem });
});

export default router;
