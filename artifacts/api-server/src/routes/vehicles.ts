import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, vehiclesTable } from "@workspace/db";
import {
  CreateVehicleBody,
  UpdateVehicleBody,
  GetVehicleParams,
  UpdateVehicleParams,
  DeleteVehicleParams,
  ListVehiclesQueryParams,
  ListVehiclesResponse,
  GetVehicleResponse,
  UpdateVehicleResponse,
} from "@workspace/api-zod";
import { tenantCompanyId } from "../middlewares/auth";

const router = Router();

function serializeVehicle(v: typeof vehiclesTable.$inferSelect) {
  return { ...v, createdAt: v.createdAt.toISOString() };
}

router.get("/vehicles", async (req, res): Promise<void> => {
  const qp = ListVehiclesQueryParams.safeParse(req.query);
  const conditions = [eq(vehiclesTable.companyId, tenantCompanyId(req))];
  if (qp.success && qp.data.status != null) conditions.push(eq(vehiclesTable.status, qp.data.status));
  const rows = await db.select().from(vehiclesTable).where(and(...conditions));
  res.json(ListVehiclesResponse.parse(rows.map(serializeVehicle)));
});

router.post("/vehicles", async (req, res): Promise<void> => {
  const parsed = CreateVehicleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [vehicle] = await db.insert(vehiclesTable).values({ ...parsed.data, companyId: tenantCompanyId(req) }).returning();
  res.status(201).json(GetVehicleResponse.parse(serializeVehicle(vehicle)));
});

router.get("/vehicles/:id", async (req, res): Promise<void> => {
  const params = GetVehicleParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [vehicle] = await db.select().from(vehiclesTable).where(and(eq(vehiclesTable.id, params.data.id), eq(vehiclesTable.companyId, tenantCompanyId(req))));
  if (!vehicle) { res.status(404).json({ error: "Vehicle not found" }); return; }
  res.json(GetVehicleResponse.parse(serializeVehicle(vehicle)));
});

router.patch("/vehicles/:id", async (req, res): Promise<void> => {
  const params = UpdateVehicleParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateVehicleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [vehicle] = await db.update(vehiclesTable).set(parsed.data)
    .where(and(eq(vehiclesTable.id, params.data.id), eq(vehiclesTable.companyId, tenantCompanyId(req)))).returning();
  if (!vehicle) { res.status(404).json({ error: "Vehicle not found" }); return; }
  res.json(UpdateVehicleResponse.parse(serializeVehicle(vehicle)));
});

router.delete("/vehicles/:id", async (req, res): Promise<void> => {
  const params = DeleteVehicleParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [vehicle] = await db.delete(vehiclesTable)
    .where(and(eq(vehiclesTable.id, params.data.id), eq(vehiclesTable.companyId, tenantCompanyId(req)))).returning();
  if (!vehicle) { res.status(404).json({ error: "Vehicle not found" }); return; }
  res.sendStatus(204);
});

export default router;
