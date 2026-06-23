import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, companiesTable } from "@workspace/db";
import {
  UpdateCompanyBody,
  GetCompanyParams,
  UpdateCompanyParams,
  ListCompaniesResponse,
  GetCompanyResponse,
  UpdateCompanyResponse,
} from "@workspace/api-zod";
import { tenantCompanyId } from "../middlewares/auth";

const router = Router();

// A tenant only ever sees / manages its own company. There is no cross-company
// listing: the "list" endpoint returns exactly the caller's company.
router.get("/companies", async (req, res): Promise<void> => {
  const companyId = tenantCompanyId(req);
  const companies = await db.select().from(companiesTable).where(eq(companiesTable.id, companyId));
  res.json(ListCompaniesResponse.parse(companies.map(c => ({ ...c, createdAt: c.createdAt.toISOString() }))));
});

router.get("/companies/:id", async (req, res): Promise<void> => {
  const params = GetCompanyParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  if (params.data.id !== tenantCompanyId(req)) { res.status(404).json({ error: "Company not found" }); return; }
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, params.data.id));
  if (!company) { res.status(404).json({ error: "Company not found" }); return; }
  res.json(GetCompanyResponse.parse({ ...company, createdAt: company.createdAt.toISOString() }));
});

router.patch("/companies/:id", async (req, res): Promise<void> => {
  const params = UpdateCompanyParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  if (params.data.id !== tenantCompanyId(req)) { res.status(404).json({ error: "Company not found" }); return; }
  const parsed = UpdateCompanyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [company] = await db.update(companiesTable).set(parsed.data).where(eq(companiesTable.id, params.data.id)).returning();
  if (!company) { res.status(404).json({ error: "Company not found" }); return; }
  res.json(UpdateCompanyResponse.parse({ ...company, createdAt: company.createdAt.toISOString() }));
});

export default router;
