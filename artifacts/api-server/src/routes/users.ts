import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  CreateUserBody,
  UpdateUserBody,
  GetUserParams,
  UpdateUserParams,
  DeleteUserParams,
  ListUsersQueryParams,
  ListUsersResponse,
  GetUserResponse,
  UpdateUserResponse,
} from "@workspace/api-zod";
import { tenantCompanyId } from "../middlewares/auth";

const router = Router();

function safeUser(u: typeof usersTable.$inferSelect) {
  return { ...u, createdAt: u.createdAt.toISOString() };
}

router.get("/users", async (req, res): Promise<void> => {
  const qp = ListUsersQueryParams.safeParse(req.query);
  const conditions = [eq(usersTable.companyId, tenantCompanyId(req))];
  if (qp.success && qp.data.role != null) conditions.push(eq(usersTable.role, qp.data.role));
  const users = await db.select().from(usersTable).where(and(...conditions));
  res.json(ListUsersResponse.parse(users.map(safeUser)));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  // Strip any client-provided password / companyId — staff are always created
  // inside the caller's own company.
  const { password, companyId, ...rest } = parsed.data as typeof parsed.data & { password?: string };
  void password; void companyId;
  const [user] = await db.insert(usersTable).values({ ...rest, companyId: tenantCompanyId(req) }).returning();
  res.status(201).json(GetUserResponse.parse(safeUser(user)));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [user] = await db.select().from(usersTable).where(and(eq(usersTable.id, params.data.id), eq(usersTable.companyId, tenantCompanyId(req))));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(GetUserResponse.parse(safeUser(user)));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { companyId, ...rest } = parsed.data as typeof parsed.data & { companyId?: number };
  void companyId;
  const [user] = await db.update(usersTable).set(rest)
    .where(and(eq(usersTable.id, params.data.id), eq(usersTable.companyId, tenantCompanyId(req)))).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(UpdateUserResponse.parse(safeUser(user)));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [user] = await db.delete(usersTable)
    .where(and(eq(usersTable.id, params.data.id), eq(usersTable.companyId, tenantCompanyId(req)))).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.sendStatus(204);
});

export default router;
