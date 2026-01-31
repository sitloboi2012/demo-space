import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

// Initialize OpenAI client using the integration env vars
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- Reviews ---
  app.get(api.reviews.list.path, async (req, res) => {
    const reviews = await storage.getReviews();
    res.json(reviews);
  });

  app.get(api.reviews.get.path, async (req, res) => {
    const review = await storage.getReview(Number(req.params.id));
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json(review);
  });

  app.post(api.reviews.create.path, async (req, res) => {
    try {
      const input = api.reviews.create.input.parse(req.body);
      const review = await storage.createReview(input);
      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // --- Documents ---
  app.get(api.documents.list.path, async (req, res) => {
    const docs = await storage.getDocuments(Number(req.params.reviewId));
    res.json(docs);
  });

  app.post(api.documents.upload.path, async (req, res) => {
    try {
      const reviewId = Number(req.params.reviewId);
      const input = api.documents.upload.input.parse(req.body);
      
      const doc = await storage.createDocument({
        ...input,
        reviewId,
        status: "Uploaded"
      });
      res.status(201).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.documents.delete.path, async (req, res) => {
    await storage.deleteDocument(Number(req.params.id));
    res.status(204).send();
  });

  // --- Compliance ---
  app.get(api.compliance.list.path, async (req, res) => {
    const items = await storage.getComplianceItems(Number(req.params.reviewId));
    res.json(items);
  });

  app.post(api.compliance.generate.path, async (req, res) => {
    const reviewId = Number(req.params.reviewId);
    
    // Check if documents are uploaded
    const docs = await storage.getDocuments(reviewId);
    if (docs.length === 0) {
      return res.status(400).json({ message: "No documents uploaded to analyze." });
    }

    // For prototype, we'll generate realistic looking data using OpenAI
    // In a real app, we would read the PDF content.
    // Here we'll just prompt based on the filenames/context.
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: "You are a spacecraft compliance engineer. Extract requirement items from a satellite payload user guide. Generate 5-7 realistic compliance items. JSON format."
          },
          {
            role: "user",
            content: `Generate a list of compliance requirements for a satellite payload review. 
            Context: Host PUG and Payload Spec are uploaded.
            Return a JSON object with a key "items" containing an array of objects with these fields:
            - category (e.g., Mechanical, Thermal, Electrical)
            - requirement (text describing the 'shall' requirement)
            - limit (e.g., "50kg", "20W", "-20 to 50C")
            - measured (realistic measured value, some compliant, some not)
            - status (Compliant, Deviation, or Fail)
            - action (text describing mitigation or 'None')
            
            Make sure to include at least one Deviation or Fail.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content || "{}";
      const result = JSON.parse(content);
      const generatedItems = result.items || [];

      // Save to DB
      const itemsToInsert = generatedItems.map((item: any) => ({
        reviewId,
        category: item.category,
        requirement: item.requirement,
        limit: item.limit,
        measured: item.measured,
        status: item.status,
        action: item.action
      }));

      const savedItems = await storage.createComplianceItems(itemsToInsert);

      // Update review status
      await storage.updateReview(reviewId, "Analysis Complete");

      res.status(201).json(savedItems);

    } catch (error) {
      console.error("AI Generation failed:", error);
      res.status(500).json({ message: "Failed to generate compliance matrix" });
    }
  });

  // --- ICD Generation ---
  app.post(api.icd.generate.path, async (req, res) => {
    const reviewId = Number(req.params.reviewId);
    
    // Get compliance items
    const complianceItems = await storage.getComplianceItems(reviewId);
    if (complianceItems.length === 0) {
      return res.status(400).json({ message: "Run compliance analysis first before generating ICD." });
    }

    const review = await storage.getReview(reviewId);
    const docs = await storage.getDocuments(reviewId);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: `You are a spacecraft systems engineer creating Interface Control Documents (ICDs). 
Generate a professional ICD following this structure:
1. Introduction & Scope - Purpose and document scope
2. Abbreviations - Key terms used
3. Mechanical Interface - Mounting, dimensions, mass budget
4. Electrical Data Interface - Communication protocols, data rates
5. Electrical Power Interface - Power requirements, voltage rails
6. Thermal Interface - Operating temps, heat dissipation

Format the output in clean Markdown with proper headings, tables, and professional language.`
          },
          {
            role: "user",
            content: `Generate a draft Interface Control Document for the satellite payload integration review.

Review Title: ${review?.title || 'Payload Integration Review'}

Documents in context:
${docs.map(d => `- ${d.name} (${d.type})`).join('\n')}

Compliance Requirements Extracted:
${complianceItems.map(item => `- [${item.category}] ${item.requirement} | Limit: ${item.limit} | Measured: ${item.measured} | Status: ${item.status}`).join('\n')}

Generate a complete ICD draft with realistic technical specifications based on typical 6U nanosatellite payloads. Include tables for power channels, data interfaces, and thermal limits.`
          }
        ],
      });

      const icdContent = response.choices[0].message.content || "";
      res.json({ icd: icdContent });

    } catch (error) {
      console.error("ICD Generation failed:", error);
      res.status(500).json({ message: "Failed to generate ICD document" });
    }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const reviews = await storage.getReviews();
  if (reviews.length === 0) {
    console.log("Seeding database...");
    
    // Create initial reviews
    await storage.createReview({
      title: "Demo Satellite Review 1",
      description: "Compliance review session for payload integration.",
      status: "Pending Analysis"
    });

    await storage.createReview({
      title: "Testing",
      description: "Compliance review session for payload integration.",
      status: "Pending Analysis"
    });
    
    await storage.createReview({
      title: "Test Demo",
      description: "Compliance review session for payload integration.",
      status: "Pending Analysis"
    });
  }
}
