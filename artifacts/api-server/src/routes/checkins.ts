import { Router } from "express";
import { db, checkinsTable, techEvaluationsTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { CreateCheckinBody, DeleteCheckinParams } from "@workspace/api-zod";
import { Parser } from "json2csv";

const router = Router();

router.get("/checkins", async (req, res) => {
  try {
    const checkins = await db
      .select()
      .from(checkinsTable)
      .orderBy(desc(checkinsTable.createdAt));

    const checkinIds = checkins.map((c) => c.id);

    let techEvals: (typeof techEvaluationsTable.$inferSelect)[] = [];
    if (checkinIds.length > 0) {
      techEvals = await db
        .select()
        .from(techEvaluationsTable)
        .where(
          sql`${techEvaluationsTable.checkinId} = ANY(${sql.raw(`ARRAY[${checkinIds.join(",")}]::int[]`)})`,
        );
    }

    const evalsByCheckin = new Map<number, typeof techEvals>();
    for (const ev of techEvals) {
      if (!evalsByCheckin.has(ev.checkinId)) {
        evalsByCheckin.set(ev.checkinId, []);
      }
      evalsByCheckin.get(ev.checkinId)!.push(ev);
    }

    const result = checkins.map((c) => ({
      id: c.id,
      name: c.name,
      department: c.department,
      accomplishments: c.accomplishments,
      goals: c.goals,
      challenges: c.challenges ?? null,
      createdAt: c.createdAt.toISOString(),
      techEvaluations: (evalsByCheckin.get(c.id) ?? []).map((e) => ({
        id: e.id,
        checkinId: e.checkinId,
        toolName: e.toolName,
        description: e.description,
        link: e.link ?? null,
        rating: e.rating,
      })),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get checkins");
    res.status(500).json({ error: "Failed to get checkins" });
  }
});

router.post("/checkins", async (req, res) => {
  const parsed = CreateCheckinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.message });
    return;
  }

  const { name, department, accomplishments, goals, challenges, techEvaluations } = parsed.data;

  try {
    const [checkin] = await db
      .insert(checkinsTable)
      .values({ name, department, accomplishments, goals, challenges: challenges ?? null })
      .returning();

    let insertedEvals: (typeof techEvaluationsTable.$inferSelect)[] = [];
    if (techEvaluations && techEvaluations.length > 0) {
      insertedEvals = await db
        .insert(techEvaluationsTable)
        .values(
          techEvaluations.map((ev) => ({
            checkinId: checkin.id,
            toolName: ev.toolName,
            description: ev.description,
            link: ev.link ?? null,
            rating: ev.rating,
          })),
        )
        .returning();
    }

    res.status(201).json({
      id: checkin.id,
      name: checkin.name,
      department: checkin.department,
      accomplishments: checkin.accomplishments,
      goals: checkin.goals,
      challenges: checkin.challenges ?? null,
      createdAt: checkin.createdAt.toISOString(),
      techEvaluations: insertedEvals.map((e) => ({
        id: e.id,
        checkinId: e.checkinId,
        toolName: e.toolName,
        description: e.description,
        link: e.link ?? null,
        rating: e.rating,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create checkin");
    res.status(500).json({ error: "Failed to create checkin" });
  }
});

router.delete("/checkins/:id", async (req, res) => {
  const parsed = DeleteCheckinParams.safeParse({ id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const deleted = await db
      .delete(checkinsTable)
      .where(eq(checkinsTable.id, parsed.data.id))
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({ error: "Check-in not found" });
      return;
    }

    res.json({ success: true, message: "Check-in deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete checkin");
    res.status(500).json({ error: "Failed to delete checkin" });
  }
});

router.get("/checkins/stats", async (req, res) => {
  try {
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(checkinsTable);

    const [{ totalTools }] = await db
      .select({ totalTools: sql<number>`count(*)::int` })
      .from(techEvaluationsTable);

    const [{ avgRating }] = await db
      .select({ avgRating: sql<number>`coalesce(avg(${techEvaluationsTable.rating})::numeric(4,2), 0)` })
      .from(techEvaluationsTable);

    const topTools = await db
      .select({
        toolName: techEvaluationsTable.toolName,
        count: sql<number>`count(*)::int`,
        avgRating: sql<number>`round(avg(${techEvaluationsTable.rating})::numeric, 2)`,
      })
      .from(techEvaluationsTable)
      .groupBy(techEvaluationsTable.toolName)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    const deptBreakdown = await db
      .select({
        department: checkinsTable.department,
        count: sql<number>`count(*)::int`,
      })
      .from(checkinsTable)
      .groupBy(checkinsTable.department)
      .orderBy(desc(sql`count(*)`));

    res.json({
      totalCheckins: total,
      totalToolsEvaluated: totalTools,
      averageRating: Number(avgRating),
      topTools: topTools.map((t) => ({
        toolName: t.toolName,
        count: t.count,
        avgRating: Number(t.avgRating),
      })),
      departmentBreakdown: deptBreakdown,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/export/csv", async (req, res) => {
  try {
    const checkins = await db
      .select()
      .from(checkinsTable)
      .orderBy(desc(checkinsTable.createdAt));

    const allEvals = await db.select().from(techEvaluationsTable);

    const evalsByCheckin = new Map<number, typeof allEvals>();
    for (const ev of allEvals) {
      if (!evalsByCheckin.has(ev.checkinId)) {
        evalsByCheckin.set(ev.checkinId, []);
      }
      evalsByCheckin.get(ev.checkinId)!.push(ev);
    }

    const rows: Record<string, string | number | null>[] = [];
    for (const c of checkins) {
      const evals = evalsByCheckin.get(c.id) ?? [];
      if (evals.length === 0) {
        rows.push({
          Name: c.name,
          Department: c.department,
          Accomplishments: c.accomplishments,
          Goals: c.goals,
          Challenges: c.challenges ?? "",
          "Date Submitted": c.createdAt.toISOString(),
          "Tool Name": "",
          "Tool Description": "",
          "Tool Link": "",
          "Tool Rating": "",
        });
      } else {
        for (const ev of evals) {
          rows.push({
            Name: c.name,
            Department: c.department,
            Accomplishments: c.accomplishments,
            Goals: c.goals,
            Challenges: c.challenges ?? "",
            "Date Submitted": c.createdAt.toISOString(),
            "Tool Name": ev.toolName,
            "Tool Description": ev.description,
            "Tool Link": ev.link ?? "",
            "Tool Rating": ev.rating,
          });
        }
      }
    }

    const parser = new Parser({
      fields: [
        "Name",
        "Department",
        "Accomplishments",
        "Goals",
        "Challenges",
        "Date Submitted",
        "Tool Name",
        "Tool Description",
        "Tool Link",
        "Tool Rating",
      ],
    });
    const csv = parser.parse(rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=checkins.csv");
    res.send(csv);
  } catch (err) {
    req.log.error({ err }, "Failed to export CSV");
    res.status(500).json({ error: "Failed to export CSV" });
  }
});

export default router;
