import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("Pending Analysis"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'Host PUG' or 'Payload Spec'
  fileUrl: text("file_url").notNull(),
  status: text("status").notNull().default("Pending"), // 'Pending', 'Uploaded'
});

export const complianceItems = pgTable("compliance_items", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  category: text("category").notNull(),
  requirement: text("requirement").notNull(),
  limit: text("limit").notNull(),
  measured: text("measured").notNull(),
  status: text("status").notNull(), // 'Compliant', 'Deviation', 'Fail'
  action: text("action").notNull(),
});

export const reviewsRelations = relations(reviews, ({ many }) => ({
  documents: many(documents),
  complianceItems: many(complianceItems),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  review: one(reviews, {
    fields: [documents.reviewId],
    references: [reviews.id],
  }),
}));

export const complianceItemsRelations = relations(complianceItems, ({ one }) => ({
  review: one(reviews, {
    fields: [complianceItems.reviewId],
    references: [reviews.id],
  }),
}));

export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true });
export const insertComplianceItemSchema = createInsertSchema(complianceItems).omit({ id: true });

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type ComplianceItem = typeof complianceItems.$inferSelect;
export type InsertComplianceItem = z.infer<typeof insertComplianceItemSchema>;

export type CreateReviewRequest = InsertReview;
export type UpdateReviewRequest = Partial<InsertReview>;
