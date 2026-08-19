import { Router } from "express";
import { db, casesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateCaseBody } from "@workspace/api-zod";

const router = Router();

function generateCaseId(count: number): string {
  const year = new Date().getFullYear();
  const num = String(count + 4).padStart(3, "0");
  return `CLA-${year}-${num}`;
}

router.get("/cases", async (req, res) => {
  try {
    const cases = await db.select().from(casesTable).orderBy(casesTable.submittedAt);
    res.json(cases);
  } catch (err) {
    req.log.error({ err }, "Failed to list cases");
    res.status(500).json({ error: "Failed to list cases" });
  }
});

router.post("/cases", async (req, res) => {
  try {
    const parsed = CreateCaseBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
      return;
    }

    const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(casesTable);
    const count = countResult[0]?.count ?? 0;
    const caseId = generateCaseId(count);

    const [newCase] = await db.insert(casesTable).values({
      caseId,
      reporterName: parsed.data.reporterName,
      reporterPhone: parsed.data.reporterPhone,
      childName: parsed.data.childName,
      childAge: parsed.data.childAge,
      country: parsed.data.country ?? "CANADA",
      province: parsed.data.province ?? "ONTARIO TORONTO",
      lastSeen: parsed.data.lastSeen,
      dateMissing: parsed.data.dateMissing,
      description: parsed.data.description,
      gpsEnrolled: parsed.data.gpsEnrolled ?? "no",
      caseType: parsed.data.caseType,
      status: "Open",
    }).returning();

    res.status(201).json(newCase);
  } catch (err) {
    req.log.error({ err }, "Failed to create case");
    res.status(500).json({ error: "Failed to create case" });
  }
});

router.get("/cases/stats", async (req, res) => {
  try {
    const all = await db.select().from(casesTable);
    const total = all.length;
    const open = all.filter((c) => c.status === "Open").length;
    const resolved = all.filter((c) => c.status === "Resolved").length;
    const gpsEnrolled = all.filter((c) => c.gpsEnrolled === "yes").length;

    const typeMap: Record<string, number> = {};
    for (const c of all) {
      typeMap[c.caseType] = (typeMap[c.caseType] ?? 0) + 1;
    }
    const byType = Object.entries(typeMap).map(([type, count]) => ({ type, count }));

    res.json({ total, open, resolved, gpsEnrolled, byType });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/cases/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const [found] = await db.select().from(casesTable).where(eq(casesTable.id, id));
    if (!found) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    res.json(found);
  } catch (err) {
    req.log.error({ err }, "Failed to get case");
    res.status(500).json({ error: "Failed to get case" });
  }
});

router.patch("/cases/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const { status } = req.body as { status?: string };
    const [updated] = await db
      .update(casesTable)
      .set({ ...(status ? { status } : {}) })
      .where(eq(casesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update case");
    res.status(500).json({ error: "Failed to update case" });
  }
});

export default router;
