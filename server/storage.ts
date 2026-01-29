import { db } from "./db";
import {
  reviews, documents, complianceItems,
  type Review, type InsertReview,
  type Document, type InsertDocument,
  type ComplianceItem, type InsertComplianceItem
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Reviews
  getReviews(): Promise<Review[]>;
  getReview(id: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, status: string): Promise<Review | undefined>;

  // Documents
  getDocuments(reviewId: number): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  // Compliance
  getComplianceItems(reviewId: number): Promise<ComplianceItem[]>;
  createComplianceItem(item: InsertComplianceItem): Promise<ComplianceItem>;
  // For AI generation - bulk insert would be better but simple loop is fine for prototype
  createComplianceItems(items: InsertComplianceItem[]): Promise<ComplianceItem[]>;
}

export class DatabaseStorage implements IStorage {
  async getReviews(): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(reviews.createdAt);
  }

  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async updateReview(id: number, status: string): Promise<Review | undefined> {
    const [updated] = await db.update(reviews)
      .set({ status })
      .where(eq(reviews.id, id))
      .returning();
    return updated;
  }

  async getDocuments(reviewId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.reviewId, reviewId));
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(doc).returning();
    return newDoc;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async getComplianceItems(reviewId: number): Promise<ComplianceItem[]> {
    return await db.select().from(complianceItems).where(eq(complianceItems.reviewId, reviewId));
  }

  async createComplianceItem(item: InsertComplianceItem): Promise<ComplianceItem> {
    const [newItem] = await db.insert(complianceItems).values(item).returning();
    return newItem;
  }

  async createComplianceItems(items: InsertComplianceItem[]): Promise<ComplianceItem[]> {
    if (items.length === 0) return [];
    return await db.insert(complianceItems).values(items).returning();
  }
}

export const storage = new DatabaseStorage();
