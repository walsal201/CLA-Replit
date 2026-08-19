import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const casesTable = pgTable("cases", {
  id: serial("id").primaryKey(),
  caseId: text("case_id").notNull().unique(),
  reporterName: text("reporter_name").notNull(),
  reporterPhone: text("reporter_phone").notNull(),
  childName: text("child_name").notNull(),
  childAge: integer("child_age").notNull(),
  country: text("country").notNull().default("CANADA"),
  province: text("province").notNull().default("ONTARIO TORONTO"),
  lastSeen: text("last_seen").notNull(),
  dateMissing: text("date_missing").notNull(),
  description: text("description").notNull(),
  gpsEnrolled: text("gps_enrolled").notNull().default("no"),
  caseType: text("case_type").notNull(),
  status: text("status").notNull().default("Open"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertCaseSchema = createInsertSchema(casesTable).omit({
  id: true,
  submittedAt: true,
});

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof casesTable.$inferSelect;
